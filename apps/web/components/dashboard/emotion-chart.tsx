"use client";

import { useMemo } from "react";
import { useECharts } from "../../hooks/use-echarts";

interface EmotionItem {
  name: string;
  value: number;
}

interface EmotionChartProps {
  data?: EmotionItem[];
}

const DEFAULT_DATA: EmotionItem[] = [
  { value: 42, name: "开心" },
  { value: 28, name: "平静" },
  { value: 15, name: "困惑" },
  { value: 10, name: "疲惫" },
  { value: 5, name: "不满" },
];

const COLOR_MAP: Record<string, string> = {
  开心: "#5C7A68",
  平静: "#D4B068",
  困惑: "#8B7355",
  疲惫: "#999999",
  不满: "#C75B5B",
};

export function EmotionChart({ data = DEFAULT_DATA }: EmotionChartProps) {
  const option = useMemo(
    () => ({
      title: {
        text: "情感分布",
        textStyle: { color: "#2D2E2C", fontSize: 13, fontWeight: 600 },
        left: 12,
        top: 8,
      },
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c}%",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderColor: "#E5E5E5",
      },
      legend: {
        orient: "vertical",
        right: 8,
        top: "center",
        textStyle: { color: "#666666", fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 8,
      },
      series: [
        {
          name: "情感分布",
          type: "pie",
          radius: ["38%", "68%"],
          center: ["38%", "55%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: "bold",
              color: "#2D2E2C",
            },
          },
          data: data.map((item) => ({
            ...item,
            itemStyle: { color: COLOR_MAP[item.name] || "#999999" },
          })),
        },
      ],
    }),
    [data]
  );

  const chartRef = useECharts(option);
  return <div ref={chartRef} className="h-full w-full" />;
}
