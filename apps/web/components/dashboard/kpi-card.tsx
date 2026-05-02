"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  delay?: number;
}

export function KpiCard({ title, value, change, icon: Icon, delay = 0 }: KpiCardProps) {
  const isPositive = change && change >= 0;
  const changeText = change ? `${isPositive ? "+" : ""}${change}%` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zen-bamboo/10">
        <Icon className="h-5 w-5 text-zen-bamboo" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zen-ash/70">{title}</p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-zen-ink">{value}</span>
          {changeText && (
            <span
              className={`text-xs font-medium ${
                isPositive ? "text-zen-bamboo" : "text-red-500"
              }`}
            >
              {changeText}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
