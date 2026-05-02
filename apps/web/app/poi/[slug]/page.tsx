import { notFound } from "next/navigation";
import { Pill, SectionHeading, Surface } from "@handan/ui";

import { getPoiBySlug } from "../../../lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poi = getPoiBySlug(slug);
  return {
    title: poi?.name ?? "景点详情",
    description: poi?.intro ?? "查看邯郸景点详情。",
  };
}

export default async function PoiDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poi = getPoiBySlug(slug);

  if (!poi) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 md:px-8">
      <Surface className="overflow-hidden">
        <div
          className="min-h-72 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(180deg, rgba(18,18,18,0.14), rgba(18,18,18,0.5)), url('${poi.image}')` }}
        />
        <div className="p-6">
          <Pill>{poi.district}</Pill>
          <div className="mt-5 space-y-4">
            <SectionHeading title={poi.name} description={poi.intro} />
            <div className="flex flex-wrap gap-2">
              {poi.tags.map((tag) => (
                <Pill key={tag}>{tag}</Pill>
              ))}
            </div>
          </div>
        </div>
      </Surface>

      <div className="grid gap-6 md:grid-cols-2">
        <Surface className="p-6">
          <h2 className="font-serif text-2xl text-[#21170f]">建议游玩时长</h2>
          <p className="mt-3 text-sm leading-7 text-[#5f5045]">
            约 {poi.recommendStayMinutes} 分钟，适合和同主题点位组合成半日或一日计划。
          </p>
        </Surface>
        <Surface className="p-6">
          <h2 className="font-serif text-2xl text-[#21170f]">门票参考</h2>
          <p className="mt-3 text-sm leading-7 text-[#5f5045]">{poi.ticket}</p>
        </Surface>
      </div>

      <Surface className="p-6">
        <h2 className="font-serif text-2xl text-[#21170f]">为什么值得排进路线</h2>
        <p className="mt-3 text-sm leading-7 text-[#5f5045]">
          {poi.summary} 把它放进一天里也更顺，不容易为了赶景点把整天走得太散、太累。
        </p>
      </Surface>
    </div>
  );
}
