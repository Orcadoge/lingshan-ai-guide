"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Users, Clock, Star, Maximize2, Minimize2 } from "lucide-react";
import { KpiCard } from "../../components/dashboard/kpi-card";
import { SatisfactionChart } from "../../components/dashboard/satisfaction-chart";
import { EmotionChart } from "../../components/dashboard/emotion-chart";
import { HotQuestionsChart } from "../../components/dashboard/hot-questions-chart";
import { AttractionHeatChart } from "../../components/dashboard/attraction-heat-chart";
import { SessionTable } from "../../components/dashboard/session-table";

interface DashboardData {
  totalSessions: number;
  activeVisitors: number;
  avgDuration: string;
  satisfaction: number;
  satisfactionChange: number;
  sessionChange: number;
  visitorChange: number;
  durationChange: number;
  trend: {
    dates: string[];
    satisfaction: number[];
    sessionCounts: number[];
  };
  emotions: { name: string; value: number }[];
  hotQuestions: { question: string; count: number }[];
  hotPois: { name: string; visits: number; satisfaction: number }[];
  recentSessions: {
    time: string;
    visitorId: string;
    question: string;
    emotion: string;
    satisfaction: number;
  }[];
}

const DEFAULT_DATA: DashboardData = {
  totalSessions: 1284,
  activeVisitors: 356,
  avgDuration: "4m 32s",
  satisfaction: 4.7,
  satisfactionChange: 0.3,
  sessionChange: 12.5,
  visitorChange: 8.3,
  durationChange: -2.1,
  trend: {
    dates: ["04-26", "04-27", "04-28", "04-29", "04-30", "05-01", "05-02"],
    satisfaction: [4.2, 4.3, 4.5, 4.4, 4.6, 4.7, 4.7],
    sessionCounts: [980, 1050, 1200, 1100, 1350, 1284, 1100],
  },
  emotions: [
    { value: 42, name: "开心" },
    { value: 28, name: "平静" },
    { value: 15, name: "困惑" },
    { value: 10, name: "疲惫" },
    { value: 5, name: "不满" },
  ],
  hotQuestions: [
    { question: "禅修体验怎么预约", count: 76 },
    { question: "最佳拍照点", count: 87 },
    { question: "亲子适合去哪些地方", count: 98 },
    { question: "五印坛城介绍", count: 115 },
    { question: "素斋在哪里吃", count: 128 },
    { question: "推荐一日游路线", count: 142 },
    { question: "拈花湾怎么去", count: 154 },
    { question: "梵宫门票多少钱", count: 176 },
    { question: "九龙灌浴表演时间", count: 198 },
    { question: "灵山大佛有多高", count: 234 },
  ],
  hotPois: [
    { name: "祥符禅寺", visits: 980, satisfaction: 4.5 },
    { name: "禅意街区", visits: 1230, satisfaction: 4.2 },
    { name: "曼飞龙塔", visits: 1560, satisfaction: 4.3 },
    { name: "五印坛城", visits: 1980, satisfaction: 4.4 },
    { name: "拈花湾", visits: 2340, satisfaction: 4.5 },
    { name: "梵宫", visits: 2650, satisfaction: 4.7 },
    { name: "九龙灌浴", visits: 2890, satisfaction: 4.6 },
    { name: "灵山大佛", visits: 3420, satisfaction: 4.8 },
  ],
  recentSessions: [
    { time: "14:28", visitorId: "T-0892", question: "灵山大佛有多高", emotion: "开心", satisfaction: 5 },
    { time: "14:25", visitorId: "T-0887", question: "九龙灌浴表演时间", emotion: "平静", satisfaction: 4 },
    { time: "14:22", visitorId: "T-0881", question: "推荐一日游路线", emotion: "困惑", satisfaction: 3 },
    { time: "14:18", visitorId: "T-0876", question: "素斋在哪里吃", emotion: "开心", satisfaction: 5 },
    { time: "14:15", visitorId: "T-0870", question: "梵宫门票多少钱", emotion: "平静", satisfaction: 4 },
    { time: "14:12", visitorId: "T-0864", question: "亲子适合去哪些地方", emotion: "开心", satisfaction: 5 },
    { time: "14:08", visitorId: "T-0858", question: "五印坛城介绍", emotion: "平静", satisfaction: 4 },
    { time: "14:05", visitorId: "T-0852", question: "最佳拍照点", emotion: "开心", satisfaction: 5 },
  ],
};

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 实时时钟
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // 对接真实 API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [sessionsRes, emotionsRes, questionsRes, poisRes] = await Promise.all([
          fetch(`/admin/analytics/sessions?range=${timeRange}`),
          fetch(`/admin/analytics/emotions?range=${timeRange}`),
          fetch(`/admin/analytics/hot-questions?range=${timeRange}`),
          fetch(`/admin/analytics/hot-pois?range=${timeRange}`),
        ]);

        let newData = { ...DEFAULT_DATA };

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          // Try to extract data from various possible response shapes
          if (sessionsData.totalSessions !== undefined) {
            newData.totalSessions = sessionsData.totalSessions;
          }
          if (sessionsData.activeVisitors !== undefined) {
            newData.activeVisitors = sessionsData.activeVisitors;
          }
          if (sessionsData.avgDuration !== undefined) {
            newData.avgDuration = sessionsData.avgDuration;
          }
          if (sessionsData.satisfaction !== undefined) {
            newData.satisfaction = sessionsData.satisfaction;
          }
          if (sessionsData.trend) {
            newData.trend = sessionsData.trend;
          }
          if (sessionsData.recentSessions) {
            newData.recentSessions = sessionsData.recentSessions;
          }
        }

        if (emotionsRes.ok) {
          const emotionsData = await emotionsRes.json();
          if (Array.isArray(emotionsData.emotions)) {
            newData.emotions = emotionsData.emotions;
          } else if (Array.isArray(emotionsData)) {
            newData.emotions = emotionsData;
          }
        }

        if (questionsRes.ok) {
          const questionsData = await questionsRes.json();
          if (Array.isArray(questionsData.questions)) {
            newData.hotQuestions = questionsData.questions;
          } else if (Array.isArray(questionsData)) {
            newData.hotQuestions = questionsData;
          }
        }

        if (poisRes.ok) {
          const poisData = await poisRes.json();
          if (Array.isArray(poisData.pois)) {
            newData.hotPois = poisData.pois;
          } else if (Array.isArray(poisData)) {
            newData.hotPois = poisData;
          }
        }

        setData(newData);
      } catch (err) {
        console.error("Dashboard API error:", err);
        setError("数据加载失败，显示默认数据");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-zen-paper text-zen-ink">
      {/* 顶部标题栏 */}
      <header className="flex items-center justify-between border-b border-zen-bamboo/10 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-zen-ink">
            灵山胜境 · AI数字人导游运营数据大屏
          </h1>
          <span className="rounded-full bg-zen-bamboo/10 px-2 py-0.5 text-[10px] text-zen-bamboo">
            实时
          </span>
          {loading && (
            <span className="text-[10px] text-zen-ash animate-pulse">加载中...</span>
          )}
          {error && (
            <span className="text-[10px] text-red-400">{error}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* 时间范围切换 */}
          <div className="flex items-center gap-1 rounded-lg bg-zen-paper p-0.5">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-md px-3 py-1 text-xs transition-colors ${
                  timeRange === range
                    ? "bg-white text-zen-bamboo shadow-sm"
                    : "text-zen-ash hover:text-zen-ink"
                }`}
              >
                {range === "7d" ? "近7天" : range === "30d" ? "近30天" : "近90天"}
              </button>
            ))}
          </div>
          <span className="text-sm text-zen-ash">{currentTime}</span>
          <button
            onClick={toggleFullscreen}
            className="rounded-lg p-1.5 text-zen-ash hover:bg-zen-paper hover:text-zen-ink transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="p-4">
        {/* 第一行：概览 + 趋势 + 情感 */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* KPI 卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-3"
          >
            <KpiCard
              title="今日会话数"
              value={data.totalSessions.toLocaleString()}
              change={data.sessionChange}
              icon={MessageCircle}
              delay={0}
            />
            <KpiCard
              title="活跃游客数"
              value={data.activeVisitors.toLocaleString()}
              change={data.visitorChange}
              icon={Users}
              delay={0.1}
            />
            <KpiCard
              title="平均会话时长"
              value={data.avgDuration}
              change={data.durationChange}
              icon={Clock}
              delay={0.2}
            />
            <KpiCard
              title="满意度评分"
              value={`${data.satisfaction}/5.0`}
              change={data.satisfactionChange}
              icon={Star}
              delay={0.3}
            />
          </motion.div>

          {/* 满意度趋势 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="col-span-1 rounded-2xl bg-white p-3 shadow-sm lg:col-span-2"
            style={{ minHeight: 320 }}
          >
            <SatisfactionChart data={data.trend} />
          </motion.div>

          {/* 情感分布 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-2xl bg-white p-3 shadow-sm"
            style={{ minHeight: 320 }}
          >
            <EmotionChart data={data.emotions} />
          </motion.div>
        </div>

        {/* 第二行：热门问答 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-4 rounded-2xl bg-white p-3 shadow-sm"
          style={{ height: 240 }}
        >
          <HotQuestionsChart data={data.hotQuestions} />
        </motion.div>

        {/* 第三行：景点热度 + 实时会话 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="rounded-2xl bg-white p-3 shadow-sm"
            style={{ minHeight: 320 }}
          >
            <AttractionHeatChart data={data.hotPois} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="rounded-2xl bg-white shadow-sm"
            style={{ minHeight: 320 }}
          >
            <SessionTable data={data.recentSessions} />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
