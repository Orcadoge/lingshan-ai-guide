import { notFound } from "next/navigation";
import Link from "next/link";
import { Pill, SectionHeading, Surface } from "@handan/ui";

import { getThemeBySlug, listFoodsForTheme, listPoisByTheme } from "../../../lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const theme = getThemeBySlug(slug);
  return {
    title: theme?.name ?? "主题玩法",
    description: theme?.intro ?? "查看邯郸主题玩法。",
  };
}

export default async function ThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const theme = getThemeBySlug(slug);

  if (!theme) {
    notFound();
  }

  const pois = listPoisByTheme(theme.slug);
  const foods = listFoodsForTheme(theme.slug);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-10 md:px-8">
      <Surface className="overflow-hidden p-0">
        <div
          className="min-h-80 p-6 text-white md:p-10"
          style={{ backgroundImage: theme.heroImage, backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <Pill className="border-white/40 text-white">主题玩法</Pill>
          <h1 className="zh-heading mt-6 max-w-3xl font-serif text-[clamp(2.5rem,6vw,3rem)] leading-tight">
            {theme.name}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-white/90">{theme.intro}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {theme.bullets.map((bullet) => (
              <Pill key={bullet} className="border-white/30 text-white">
                {bullet}
              </Pill>
            ))}
          </div>
        </div>
      </Surface>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface className="p-6">
          <SectionHeading eyebrow="景点" title="适合这个主题的景点" />
          <div className="mt-5 space-y-3">
            {pois.map((poi) => (
              <Link key={poi.slug} href={`/poi/${poi.slug}`} className="block rounded-[22px] border border-[#ead9c0] bg-[#fffdf8] p-4">
                <h3 className="font-medium text-[#21170f]">{poi.name}</h3>
                <p className="mt-2 text-sm leading-7 text-[#5f5045]">{poi.intro}</p>
              </Link>
            ))}
          </div>
        </Surface>
        <Surface className="p-6">
          <SectionHeading eyebrow="美食" title="适合这个主题的风味" />
          <div className="mt-5 space-y-3">
            {foods.map((food) => (
              <Link key={food.slug} href={`/food/${food.slug}`} className="block rounded-[22px] border border-[#ead9c0] bg-[#fffdf8] p-4">
                <h3 className="font-medium text-[#21170f]">{food.name}</h3>
                <p className="mt-2 text-sm leading-7 text-[#5f5045]">{food.intro}</p>
              </Link>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}
