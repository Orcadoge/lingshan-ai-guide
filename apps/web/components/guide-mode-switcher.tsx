"use client";

import { Bot, MapPinned, Mic, Sparkles } from "lucide-react";
import { useState } from "react";

import { PlanForm } from "./plan-form";
import { VoiceGuide } from "./voice-guide";

type GuideMode = "voice" | "plan";

const guideModes: Array<{
  id: GuideMode;
  title: string;
  description: string;
  icon: typeof Mic;
}> = [
  {
    id: "voice",
    title: "语音导游",
    description: "边走边问，适合临时查景点、问吃饭、听讲解。",
    icon: Mic,
  },
  {
    id: "plan",
    title: "AI 路线规划",
    description: "先说时间和偏好，再生成一条顺路好走的行程。",
    icon: MapPinned,
  },
];

export function GuideModeSwitcher() {
  const [mode, setMode] = useState<GuideMode>("voice");

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {guideModes.map((item) => {
          const Icon = item.icon;
          const isActive = mode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`group relative overflow-hidden rounded-[28px] border p-5 text-left shadow-[0_22px_70px_rgba(49,38,21,0.12)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 ${
                isActive
                  ? "border-[#1d221e] bg-[#1d221e] text-white"
                  : "border-white/50 bg-white/68 text-[#1d221e] hover:bg-white"
              }`}
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-2xl transition ${
                  isActive ? "bg-white/14 text-[#f3c77a]" : "bg-[#efe3d1] text-[#744b26]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-5 flex items-center justify-between gap-4">
                <span className="font-serif text-2xl">{item.title}</span>
                {isActive ? <Sparkles className="h-4 w-4 text-[#f3c77a]" /> : null}
              </span>
              <span
                className={`mt-3 block text-sm leading-7 ${
                  isActive ? "text-white/70" : "text-[#675f54]"
                }`}
              >
                {item.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-[38px] border border-white/28 bg-white/24 p-3 shadow-[0_34px_90px_rgba(49,38,21,0.16)] backdrop-blur-2xl md:p-5">
        {mode === "voice" ? (
          <VoiceGuide />
        ) : (
          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/46 bg-white/72 p-5 text-[#1d221e] shadow-[0_20px_60px_rgba(49,38,21,0.08)]">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#efe3d1] px-3 py-1.5 text-xs font-semibold text-[#744b26]">
                <Bot className="h-3.5 w-3.5" />
                AI 路线规划
              </div>
              <p className="mt-4 font-serif text-2xl leading-tight">
                告诉我你想怎么玩，我来帮你把路线排顺。
              </p>
              <p className="mt-2 text-sm leading-7 text-[#675f54]">
                适合先确定半天、一日或两日行程，也可以继续调整少走路、多吃本地味道等偏好。
              </p>
            </div>
            <PlanForm />
          </div>
        )}
      </div>
    </div>
  );
}
