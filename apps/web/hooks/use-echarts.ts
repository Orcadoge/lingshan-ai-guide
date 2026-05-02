"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export function useECharts(option: echarts.EChartsOption) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const optionRef = useRef(option);

  // Update option when it changes
  useEffect(() => {
    optionRef.current = option;
    if (chartInstance.current) {
      chartInstance.current.setOption(option, true);
    }
  }, [option]);

  // Initialize chart once
  useEffect(() => {
    if (!chartRef.current) return;
    chartInstance.current = echarts.init(chartRef.current);
    chartInstance.current.setOption(optionRef.current);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return chartRef;
}
