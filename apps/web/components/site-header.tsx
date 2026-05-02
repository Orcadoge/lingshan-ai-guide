import Link from "next/link";
import { Bot } from "lucide-react";

import { SiteCompetitionLogo } from "./site-competition-logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-[rgba(250,248,244,0.78)] shadow-[0_10px_40px_rgba(42,35,25,0.06)] backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="overflow-hidden rounded-[18px] border border-[#d9d0c3] bg-white/90 px-2 py-1 shadow-[0_10px_24px_rgba(42,35,25,0.08)]">
            <SiteCompetitionLogo
              width={88}
              height={47}
              priority
              className="h-auto w-[72px] md:w-[88px]"
            />
          </div>
          <div className="min-w-0">
            <p className="font-serif text-sm leading-tight tracking-wide text-[#1d221e] md:text-base">
              <span className="block">赵都云旅·</span>
              <span className="block">云端图鉴智行指南</span>
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#8b765b]">
              ZHAODU CLOUD TRAVEL GUIDE
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 text-sm text-[#5f584c] lg:flex">
            <Link className="rounded-full px-4 py-2 transition hover:bg-white/70 hover:text-[#1d221e]" href="/#routes">推荐路线</Link>
            <Link className="rounded-full px-4 py-2 transition hover:bg-white/70 hover:text-[#1d221e]" href="/#atlas">邯郸图鉴</Link>
            <Link className="rounded-full px-4 py-2 transition hover:bg-white/70 hover:text-[#1d221e]" href="/#planner">安排行程</Link>
            <Link className="rounded-full px-4 py-2 transition hover:bg-white/70 hover:text-[#1d221e]" href="/faq">游客服务</Link>
          </nav>

          <Link
            href="/guide"
            className="inline-flex items-center gap-2 rounded-full bg-[#171915] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(23,25,21,0.18)] transition hover:-translate-y-0.5 hover:bg-[#2c2f28] md:px-5"
          >
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI 导游</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
