import { ArrowLeft, MapPinned, Sparkles, Shirt } from "lucide-react";
import Link from "next/link";
import DigitalHumanStage from "./components/DigitalHumanStage";
import ChatStream from "./components/ChatStream";
import ActionBar from "./components/ActionBar";

export const metadata = {
  title: "灵山胜境 · AI数字人导游",
  description: "与国风数字人导游对话，探索灵山胜境的佛教文化与禅意生活。",
};

export default function GuidePage() {
  return (
    <div className="h-screen w-full bg-zen-paper overflow-hidden flex flex-col relative">
      {/* 区域A：数字人舞台 (40%) */}
      <section className="h-[40%] w-full relative shrink-0">
        <DigitalHumanStage />
        {/* 切换服装按钮 */}
        <button className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zen-fog/90 backdrop-blur-glass border border-zen-glaze/20 text-zen-ink text-xs shadow-sm hover:bg-zen-fog transition-colors">
          <Shirt className="w-3.5 h-3.5 text-zen-bamboo" />
          <span>换装</span>
        </button>
      </section>

      {/* 区域B：对话流 (50%) */}
      <section className="h-[50%] w-full flex-1 overflow-hidden relative">
        <ChatStream />
      </section>

      {/* 区域C：底部操作台 (10%) */}
      <section className="h-[10%] w-full shrink-0">
        <ActionBar />
      </section>
    </div>
  );
}
