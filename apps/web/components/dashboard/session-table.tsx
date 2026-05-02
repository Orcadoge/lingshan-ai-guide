"use client";

import { motion } from "framer-motion";

interface SessionRecord {
  time: string;
  visitorId: string;
  question: string;
  emotion: string;
  satisfaction: number;
}

interface SessionTableProps {
  data?: SessionRecord[];
}

const DEFAULT_SESSIONS: SessionRecord[] = [
  { time: "14:28", visitorId: "T-0892", question: "灵山大佛有多高", emotion: "开心", satisfaction: 5 },
  { time: "14:25", visitorId: "T-0887", question: "九龙灌浴表演时间", emotion: "平静", satisfaction: 4 },
  { time: "14:22", visitorId: "T-0881", question: "推荐一日游路线", emotion: "困惑", satisfaction: 3 },
  { time: "14:18", visitorId: "T-0876", question: "素斋在哪里吃", emotion: "开心", satisfaction: 5 },
  { time: "14:15", visitorId: "T-0870", question: "梵宫门票多少钱", emotion: "平静", satisfaction: 4 },
  { time: "14:12", visitorId: "T-0864", question: "亲子适合去哪些地方", emotion: "开心", satisfaction: 5 },
  { time: "14:08", visitorId: "T-0858", question: "五印坛城介绍", emotion: "平静", satisfaction: 4 },
  { time: "14:05", visitorId: "T-0852", question: "最佳拍照点", emotion: "开心", satisfaction: 5 },
];

const emotionColors: Record<string, string> = {
  开心: "bg-zen-bamboo/15 text-zen-bamboo",
  平静: "bg-zen-glaze/15 text-zen-glaze",
  困惑: "bg-yellow-500/15 text-yellow-600",
  疲惫: "bg-gray-200 text-gray-500",
  不满: "bg-red-100 text-red-500",
};

export function SessionTable({ data = DEFAULT_SESSIONS }: SessionTableProps) {
  return (
    <div className="h-full w-full overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* 表头 */}
      <div className="grid grid-cols-[60px_80px_1fr_60px_60px] items-center gap-2 border-b border-zen-bamboo/10 px-3 py-2 text-[11px] font-medium text-zen-bamboo">
        <span>时间</span>
        <span>游客</span>
        <span>问题摘要</span>
        <span>情感</span>
        <span>评分</span>
      </div>

      {/* 表格内容 */}
      <div className="h-[calc(100%-36px)] overflow-y-auto">
        {data.map((session, idx) => (
          <motion.div
            key={`${session.visitorId}-${idx}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            className={`grid grid-cols-[60px_80px_1fr_60px_60px] items-center gap-2 px-3 py-2.5 text-xs ${
              idx % 2 === 0 ? "bg-white" : "bg-zen-paper/50"
            }`}
          >
            <span className="text-zen-ash/60">{session.time}</span>
            <span className="truncate text-zen-ash">{session.visitorId}</span>
            <span className="truncate text-zen-ink">{session.question}</span>
            <span className={`inline-flex w-fit items-center rounded-full px-1.5 py-0.5 text-[10px] ${emotionColors[session.emotion] || "bg-gray-100 text-gray-500"}`}>
              {session.emotion}
            </span>
            <span className="text-zen-glaze">{"★".repeat(session.satisfaction)}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
