import Link from "next/link";
import { Surface } from "@handan/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 md:px-8">
      <Surface className="space-y-4 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-[#876446]">404</p>
        <h1 className="font-serif text-4xl text-[#21170f]">页面走丢了</h1>
        <p className="text-sm leading-7 text-[#5f5045]">
          你可以回首页重新生成路线，或者从主题页重新进入。
        </p>
        <Link href="/" className="inline-flex rounded-full bg-[#21170f] px-5 py-3 text-sm text-[#f8efe2]">
          返回首页
        </Link>
      </Surface>
    </div>
  );
}
