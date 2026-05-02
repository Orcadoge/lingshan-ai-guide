import { notFound } from "next/navigation";
import { Pill, SectionHeading, Surface } from "@handan/ui";

import { getRouteTemplateBySlug } from "../../../lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = getRouteTemplateBySlug(slug);
  return {
    title: route?.title ?? "经典路线",
    description: route?.summary ?? "查看经典路线模板。",
  };
}

export default async function RouteTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = getRouteTemplateBySlug(slug);
  if (!route) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 md:px-8">
      <Surface className="p-6">
        <Pill>{route.duration}</Pill>
        <div className="mt-5">
          <SectionHeading title={route.title} description={route.summary} />
        </div>
      </Surface>
      <Surface className="p-6">
        <h2 className="font-serif text-2xl text-[#21170f]">路线亮点</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {route.highlights.map((highlight) => (
            <Pill key={highlight}>{highlight}</Pill>
          ))}
        </div>
      </Surface>
    </div>
  );
}
