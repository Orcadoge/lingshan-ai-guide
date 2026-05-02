import { Suspense } from "react";
import { SectionHeading, Surface } from "@handan/ui";

import { PlanResultView } from "../../components/plan-result-view";

export const metadata = {
  title: "路线结果页",
  description: "查看邯郸路线结果，并继续微调行程。",
};

export default function PlanPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-10 md:px-8">
      <Surface className="p-6">
        <SectionHeading
          eyebrow="Plan"
          title="你的邯郸路线结果"
          description="这里会展示每天怎么走、吃什么、预算大概多少，以及可替换的安排。"
        />
      </Surface>
      <Suspense
        fallback={
          <Surface className="p-6 text-sm text-[#5f5045]">
            正在加载路线结果...
          </Surface>
        }
      >
        <PlanResultView />
      </Suspense>
    </div>
  );
}
