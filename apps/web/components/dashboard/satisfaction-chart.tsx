"use client";

import { useMemo } from "react";
import { useECharts } from "../../hooks/use-echarts";

interface TrendData {
  dates: string[];
  satisfaction: number[];
  sessionCounts: number[];
}

interface SatisfactionChartProps {
  data?: TrendData;
}

const DEFAULT_DATA: TrendData = {
  dates: ["04-26", "04-27", "04-28", "04-29", "04-30", "05-01", "05-02"],
  satisfaction: [4.2, 4.3, 4.5, 4.4, 4.6, 4.7, 4.7],
  sessionCounts: [980, 1050, 1200, 1100, 1350, 1284, 1100],
};

export function SatisfactionChart({ data = DEFAULT_DATA }: SatisfactionChartProps) {
  const option = useMemo(
    () => ({
      title: {
        text: "满意度趋势",
        textStyle: { color: "#2D2E2C", fontSize: 13, fontWeight: 600 },
        left: 12,
        top: 8,
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderColor: "#E5E5E5",
        textStyle: { color: "#2D2E2C", fontSize: 12 },
      },
      legend: {
        data: ["满意度", "会话量"],
        right: 12,
        top: 8,
        textStyle: { color: "#666666", fontSize: 11 },
        itemWidth: 12,
        itemHeight: 8,
      },
      grid: { left: 48, right: 16, top: 48, bottom: 24 },
      xAxis: {
        type: "category",
        data: data.dates,
        axisLine: { lineStyle: { color: "#E5E5E5" } },
        axisLabel: { color: "#666666", fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: "value",
          min: 3,
          max: 5,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: "#F0F0F0" } },
          axisLabel: { color: "#666666", fontSize: 10 },
        },
        {
          type: "value",
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: { color: "#666666", fontSize: 10 },
        },
      ],
      series: [
        {
          name: "满意度",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          data: data.satisfaction,
          itemStyle: { color: "#5C7A68" },
          lineStyle: { width: 2.5 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(92,122,104,0.18)" },
                { offset: 1, color: "rgba(92,122,104,0.02)" },
              ],
            },
          },
        },
        {
          name: "会话量",
          type: "line",
          smooth: true,
          yAxisIndex: 1,
          symbol: "circle",
          symbolSize: 6,
          data: data.sessionCounts,
          itemStyle: { color: "#D4B068" },
          lineStyle: { width: 2, type: "dashed" },
        },
      ],
    }),
    [data]
  );

  const chartRef = useECharts(option);
  return <div ref={chartRef} className="h-full w-full" />;
}
