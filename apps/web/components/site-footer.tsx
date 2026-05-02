import Link from "next/link";

import { SiteCompetitionLogo } from "./site-competition-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#e2dacf] bg-[#f7f4ee]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm text-[#626056] md:grid-cols-3 md:px-8">
        <div className="space-y-3">
          <div className="inline-flex overflow-hidden rounded-[20px] border border-[#ddd4c8] bg-white px-3 py-2 shadow-sm">
            <SiteCompetitionLogo
              width={140}
              height={75}
              className="h-auto w-[116px] md:w-[140px]"
            />
          </div>
          <p className="font-serif text-xl leading-tight text-[#1d221e] md:text-2xl">
            <span className="block">赵都云旅·</span>
            <span className="block">云端图鉴智行指南</span>
          </p>
          <p>
            给想来邯郸的人一份更顺手的出行参考：去哪里、怎么走、吃什么，都先替你理一遍。
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[#8b765b]">浏览</p>
          <Link href="/theme/citywalk" className="block">
            主题玩法
          </Link>
          <Link href="/routes/historic-weekend" className="block">
            经典路线
          </Link>
          <Link href="/faq" className="block">
            常见问题
          </Link>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[#8b765b]">适合谁</p>
          <p>第一次来邯郸，不知道先去哪里的人。</p>
          <p>想兼顾景点、美食和体力安排的人。</p>
        </div>
      </div>
    </footer>
  );
}
