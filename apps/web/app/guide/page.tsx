import { ArrowLeft, MapPinned, Sparkles } from "lucide-react";
import Link from "next/link";

import { GuideModeSwitcher } from "../../components/guide-mode-switcher";

export const metadata = {
  title: "AI 导游",
  description: "用语音或文字向邯郸 AI 导游提问，获得景点、美食和路线建议。",
};

export default function GuidePage() {
  return (
    <div className="guide-page relative overflow-hidden px-5 py-14 md:px-8 md:py-20">
      <div className="guide-glow guide-glow-one" />
      <div className="guide-glow guide-glow-two" />

      <div className="mx-auto grid max-w-7xl gap-10 xl:grid-cols-[0.72fr_1.28fr] xl:items-start">
        <section className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#dacbb5] bg-white/70 px-4 py-2 text-sm font-semibold text-[#5f584c] backdrop-blur-xl transition hover:bg-white hover:text-[#1d221e]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.42em] text-[#8b765b]">
            AI TRAVEL GUIDE
          </p>
          <h1 className="zh-heading mt-5 font-serif text-[clamp(3rem,8vw,6.6rem)] leading-[0.96] tracking-[-0.08em] text-[#171915]">
            <span className="zh-line">想问路，</span>
            <span className="zh-line text-[#8c5d2d]">也想排路线。</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#5f584c] md:text-lg">
            你可以直接开口问导游，也可以先说时间、同行人和偏好，
            让它帮你排出一条顺路、好吃、节奏合适的邯郸路线。
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <div className="guide-tip">
              <MapPinned className="h-5 w-5" />
              <span>问路线：半天 / 一日 / 两日</span>
            </div>
            <div className="guide-tip">
              <Sparkles className="h-5 w-5" />
              <span>问偏好：少走路 / 多拍照 / 想吃地道</span>
            </div>
          </div>
        </section>

        <section className="relative z-10">
          <GuideModeSwitcher />
        </section>
      </div>
    </div>
  );
}
