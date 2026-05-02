import type { Metadata } from "next";
import "./globals.css";

import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://qiuyu.online"),
  title: {
    default: "赵都云旅·云端图鉴智行指南 | AI智能规划路线",
    template: "%s | 赵都云旅·云端图鉴智行指南",
  },
  icons: {
    icon: "/branding/cdcc-logo.png",
    shortcut: "/branding/cdcc-logo.png",
    apple: "/branding/cdcc-logo.png",
  },
  description:
    "想来邯郸看历史、逛古城、吃本地味道，可以先让 AI 导游帮你把路线理顺。",
  openGraph: {
    title: "赵都云旅·云端图鉴智行指南",
    description: "邯郸景点、美食和路线，一句话先问清楚。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-[#f3ecdf] text-[#21170f]">
        <div className="min-h-screen">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
