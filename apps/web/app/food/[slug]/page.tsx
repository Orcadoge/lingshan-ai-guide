import { notFound } from "next/navigation";
import { Pill, SectionHeading, Surface } from "@handan/ui";

import { getFoodBySlug } from "../../../lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const food = getFoodBySlug(slug);
  return {
    title: food?.name ?? "美食详情",
    description: food?.intro ?? "查看邯郸美食详情。",
  };
}

export default async function FoodDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const food = getFoodBySlug(slug);

  if (!food) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 md:px-8">
      <Surface className="overflow-hidden">
        {food.image ? (
          <div
            className="min-h-72 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(180deg, rgba(18,18,18,0.14), rgba(18,18,18,0.48)), url('${food.image}')` }}
          />
        ) : null}
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            <Pill>{food.kind === "venue" ? "门店" : "名吃"}</Pill>
            <Pill>{food.district}</Pill>
          </div>
          <div className="mt-5 space-y-4">
            <SectionHeading title={food.name} description={food.intro} />
            <div className="flex flex-wrap gap-2">
              {food.tags.map((tag) => (
                <Pill key={tag}>{tag}</Pill>
              ))}
            </div>
          </div>
        </div>
      </Surface>
      <div className="grid gap-6 md:grid-cols-2">
        <Surface className="p-6">
          <h2 className="font-serif text-2xl text-[#21170f]">适合什么时间吃</h2>
          <p className="mt-3 text-sm leading-7 text-[#5f5045]">{food.bestTimeToEat}</p>
        </Surface>
        <Surface className="p-6">
          <h2 className="font-serif text-2xl text-[#21170f]">推荐理由</h2>
          <p className="mt-3 text-sm leading-7 text-[#5f5045]">{food.summary}</p>
        </Surface>
      </div>
    </div>
  );
}
