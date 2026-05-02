"use client";

import { useMemo } from "react";
import { useECharts } from "../../hooks/use-echarts";

interface PoiItem {
  name: string;
  visits: number;
  satisfaction: number;
}

interface AttractionHeatChartProps {
  data?: PoiItem[];
}

const DEFAULT_DATA: PoiItem[] = [
  { name: "祥符禅寺", visits: 980, satisfaction: 4.5 },
  { name: "禅意街区", visits: 1230, satisfaction: 4.2 },
  { name: "曼飞龙塔", visits: 1560, satisfaction: 4.3 },
  { name: "五印坛城", visits: 1980, satisfaction: 4.4 },
  { name: "拈花湾", visits: 2340, satisfaction: 4.5 },
  { name: "梵宫", visits: 2650, satisfaction: 4.7 },
  { name: "九龙灌浴", visits: 2890, satisfaction: 4.6 },
  { name: "灵山大佛", visits: 3420, satisfaction: 4.8 },
];

const BAR_COLORS = [
  "#8B7355",
  "#A08B6D",
  "#B5A082",
  "#C4B068",
  "#D4B068",
  "#A8C4A0",
  "#7FA88B",
  "#5C7A68",
];

export function AttractionHeatChart({ data = DEFAULT_DATA }: AttractionHeatChartProps) {
  const option = useMemo(
    () => ({
      title: {
        text: "景点热度排行",
        textStyle: { color: "#2D2E2C", fontSize: 13, fontWeight: 600 },
        left: 12,
        top: 8,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const d = params[0];
          const item = data[d.dataIndex];
          return `${d.name}<br/>访问量: ${d.value} 人次<br/>满意度: ${item?.satisfaction ?? "-"}/5.0`;
        },
        backgroundColor: "rgba(255,255,255,0.95)",
        borderColor: "#E5E5E5",
      },
      grid: { left: 16, right: 16, top: 44, bottom: 40 },
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        axisLine: { lineStyle: { color: "#E5E5E5" } },
        axisLabel: { color: "#666666", fontSize: 10, rotate: 30 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#F0F0F0" } },
        axisLabel: { color: "#666666", fontSize: 10 },
      },
      series: [
        {
          name: "访问量",
          type: "bar",
          data: data.map((d) => ({
            value: d.visits,
            satisfaction: d.satisfaction,
          })),
          itemStyle: {
            color: (params: any) => BAR_COLORS[params.dataIndex % BAR_COLORS.length],
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: "45%",
        },
      ],
    }),
    [data]
  );

  const chartRef = useECharts(option);
  return <div ref={chartRef} className="h-full w-full" />;
}
