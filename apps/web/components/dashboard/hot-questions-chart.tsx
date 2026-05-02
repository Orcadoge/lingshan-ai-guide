"use client";

import { useMemo } from "react";
import { useECharts } from "../../hooks/use-echarts";

interface QuestionItem {
  question: string;
  count: number;
}

interface HotQuestionsChartProps {
  data?: QuestionItem[];
}

const DEFAULT_DATA: QuestionItem[] = [
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
];

export function HotQuestionsChart({ data = DEFAULT_DATA }: HotQuestionsChartProps) {
  const option = useMemo(
    () => ({
      title: {
        text: "热门问答 TOP 10",
        textStyle: { color: "#2D2E2C", fontSize: 13, fontWeight: 600 },
        left: 12,
        top: 8,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: "{b}: {c} 次",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderColor: "#E5E5E5",
      },
      grid: { left: 160, right: 24, top: 40, bottom: 16 },
      xAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#F0F0F0" } },
        axisLabel: { color: "#666666", fontSize: 10 },
      },
      yAxis: {
        type: "category",
        data: data.map((d) => d.question),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#666666", fontSize: 11 },
      },
      series: [
        {
          name: "提问频次",
          type: "bar",
          data: data.map((d) => d.count),
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: "#5C7A68" },
                { offset: 1, color: "#D4B068" },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
          barWidth: "55%",
        },
      ],
    }),
    [data]
  );

  const chartRef = useECharts(option);
  return <div ref={chartRef} className="h-full w-full" />;
}
