import { SectionHeading, Surface } from "@handan/ui";

import { faqItems } from "../../lib/content";

export const metadata = {
  title: "FAQ",
  description: "赵都云旅·云端图鉴智行指南常见问题。",
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 md:px-8">
      <Surface className="p-6">
        <SectionHeading
          eyebrow="FAQ"
          title="常见问题"
          description="回答用户最关心的生成逻辑、地图、后台和部署问题。"
        />
      </Surface>
      <div className="space-y-4">
        {faqItems.map((item) => (
          <Surface key={item.q} className="p-5">
            <h2 className="font-medium text-[#21170f]">{item.q}</h2>
            <p className="mt-3 text-sm leading-7 text-[#5f5045]">{item.a}</p>
          </Surface>
        ))}
      </div>
    </div>
  );
}
