/**
 * 官方14万游客行为数据导入脚本
 * Usage: node scripts/import-visitor-behavior.js <path-to-xlsx> [--batch-size 500]
 */

const fs = require("fs");
const path = require("path");

// 动态导入 xlsx（避免未安装时报错）
let XLSX;
try {
  XLSX = require("xlsx");
} catch {
  console.error("请先安装 xlsx:  pnpm add -D xlsx");
  process.exit(1);
}

// Prisma Client（使用 packages/data 的共享实例）
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "500", 10);
const DATA_FILE = process.argv[2];

if (!DATA_FILE) {
  console.error("Usage: node import-visitor-behavior.js <path-to-xlsx>");
  process.exit(1);
}

if (!fs.existsSync(DATA_FILE)) {
  console.error(`文件不存在: ${DATA_FILE}`);
  process.exit(1);
}

function normalizeDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeFloat(val) {
  if (val === null || val === undefined || val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function normalizeInt(val) {
  if (val === null || val === undefined || val === "") return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

async function importData() {
  console.log(`[1/4] 读取数据文件: ${DATA_FILE}`);
  const workbook = XLSX.readFile(DATA_FILE);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // 解析为 JSON（第一行作为表头）
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  console.log(`[2/4] 共读取 ${rows.length} 条原始记录`);

  if (rows.length === 0) {
    console.error("数据文件为空");
    process.exit(1);
  }

  // 打印前3行的字段映射，方便调试
  console.log("字段映射示例（前3行）:");
  rows.slice(0, 3).forEach((r, i) => {
    console.log(`  行${i}:`, JSON.stringify(r).slice(0, 200));
  });

  // 清空旧数据（可选，通过环境变量控制）
  if (process.env.CLEAR_OLD === "1") {
    console.log("[2.5/4] 清空旧数据...");
    await prisma.visitorBehavior.deleteMany({});
  }

  // 批量导入
  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const createManyData = [];

    for (const row of batch) {
      try {
        // 字段名可能是中文或拼音，做兼容处理
        const touristId = String(row["tourist_id"] || row["游客ID"] || row["id"] || "");
        if (!touristId) {
          skipped++;
          continue;
        }

        createManyData.push({
          touristId,
          userNickname: String(row["user_nickname"] || row["昵称"] || ""),
          age: normalizeInt(row["age"] || row["年龄"]),
          gender: String(row["gender"] || row["性别"] || ""),
          attractionName: String(row["attraction_name"] || row["景点名称"] || row["景点"] || ""),
          attractionContent: String(row["attraction_content"] || row["景点内容"] || ""),
          attractionType: String(row["attraction_type"] || row["景点类型"] || ""),
          visitDate: normalizeDate(row["visit_date"] || row["游览日期"] || row["日期"]),
          stayDuration: normalizeFloat(row["stay_duration"] || row["停留时长"]),
          ticketCost: normalizeFloat(row["ticket_cost"] || row["门票花费"]),
          foodCost: normalizeFloat(row["food_cost"] || row["餐饮花费"]),
          shoppingCost: normalizeFloat(row["shopping_cost"] || row["购物花费"]),
          transportCost: normalizeFloat(row["transport_cost"] || row["交通花费"]),
          entertainmentCost: normalizeFloat(row["entertainment_cost"] || row["娱乐花费"]),
          totalCost: normalizeFloat(row["total_cost"] || row["总花费"]),
          groupSize: normalizeInt(row["group_size"] || row["同行人数"]),
          satisfaction: normalizeInt(row["satisfaction"] || row["满意度"]),
        });
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    }

    if (createManyData.length > 0) {
      try {
        await prisma.visitorBehavior.createMany({
          data: createManyData,
          skipDuplicates: true,
        });
        imported += createManyData.length;
        process.stdout.write(`\r[3/4] 已导入 ${imported} / ${rows.length} 条...`);
      } catch (err) {
        console.error(`\n批次导入失败 (${i}~${i + BATCH_SIZE}):`, err.message);
        errors.push({ batchIndex: i, error: err.message });
      }
    }
  }

  console.log(`\n[4/4] 导入完成: ${imported} 条成功, ${skipped} 条跳过, ${errors.length} 个错误`);

  if (errors.length > 0 && errors.length <= 10) {
    console.log("错误详情:", errors);
  }

  // 打印统计摘要
  const totalCount = await prisma.visitorBehavior.count();
  const attractionStats = await prisma.visitorBehavior.groupBy({
    by: ["attractionName"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });
  const avgSatisfaction = await prisma.visitorBehavior.aggregate({
    _avg: { satisfaction: true },
    _min: { satisfaction: true },
    _max: { satisfaction: true },
  });

  console.log("\n=== 数据统计 ===");
  console.log(`总记录数: ${totalCount}`);
  console.log(`平均满意度: ${avgSatisfaction._avg.satisfaction?.toFixed(2) || "N/A"}`);
  console.log(`满意度范围: ${avgSatisfaction._min.satisfaction || "N/A"} ~ ${avgSatisfaction._max.satisfaction || "N/A"}`);
  console.log("\nTop10 热门景点:");
  attractionStats.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.attractionName}: ${s._count.id} 次`);
  });
}

importData()
  .catch((e) => {
    console.error("导入失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
