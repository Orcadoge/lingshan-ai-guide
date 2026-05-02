"use client";

import type { PlanResult } from "@handan/shared";
import { Metric, Pill, SectionHeading, Surface } from "@handan/ui";
import { Copy, LoaderCircle, Route, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import { fetchSharedPlan, refinePlan } from "../lib/api";
import { foodLookup, poiLookup } from "../lib/content";
import { RouteMap } from "./route-map";

function mapPointsFromPlan(result: PlanResult) {
  return result.days
    .flatMap((day) =>
      day.segments
        .map((segment) => {
          const poiPoint = poiLookup[segment.entityId];
          if (segment.entityType === "poi" && poiPoint) {
            return {
              id: poiPoint.id,
              name: poiPoint.name,
              lat: poiPoint.lat,
              lng: poiPoint.lng,
              label: `${day.dayIndex} 日 · ${segment.startTime}`,
              kind: "poi" as const,
            };
          }

          const foodPoint = foodLookup[segment.entityId];
          if (segment.entityType === "foodVenue" && foodPoint) {
            return {
              id: foodPoint.id,
              name: foodPoint.name,
              lat: foodPoint.lat!,
              lng: foodPoint.lng!,
              label: `${day.dayIndex} 日 · ${segment.startTime}`,
              kind: "food" as const,
            };
          }

          return null;
        })
        .filter(Boolean),
    )
    .filter((item, index, array) => array.findIndex((target) => target?.id === item?.id) === index) as Array<{
      id: string;
      name: string;
      lat: number;
      lng: number;
      label: string;
      kind: "poi" | "food";
  }>;
}

function getVisualBySegment(segment: PlanResult["days"][number]["segments"][number]) {
  if (segment.entityType === "poi") {
    return poiLookup[segment.entityId];
  }

  if (segment.entityType === "foodVenue") {
    return foodLookup[segment.entityId];
  }

  return null;
}

function isStorySegment(segment: PlanResult["days"][number]["segments"][number]) {
  return segment.entityType === "poi" || segment.entityType === "foodVenue";
}

function buildDayLead(day: PlanResult["days"][number]) {
  return day.segments
    .filter(isStorySegment)
    .slice(0, 2)
    .map((segment) => segment.reason)
    .join(" ");
}

export function PlanResultView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shareId = searchParams.get("share");
  const [result, setResult] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refineInstruction, setRefineInstruction] = useState("减少步行，并把美食占比提高");
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    if (!shareId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchSharedPlan(shareId)
      .then((payload) => setResult(payload))
      .catch((fetchError) =>
        setError(fetchError instanceof Error ? fetchError.message : "读取分享路线失败"),
      )
      .finally(() => setLoading(false));
  }, [shareId]);

  const mapPoints = useMemo(() => (result ? mapPointsFromPlan(result) : []), [result]);
  const highlights = useMemo(() => {
    if (!result) {
      return [];
    }

    return result.days
      .flatMap((day) =>
        day.segments
          .filter((segment) => segment.entityType === "poi" || segment.entityType === "foodVenue")
          .map((segment) => ({
            dayIndex: day.dayIndex,
            segment,
            visual: getVisualBySegment(segment),
          })),
      )
      .filter((item) => item.visual)
      .slice(0, 4);
  }, [result]);
  const heroVisual = highlights[0]?.visual;

  async function handleRefine(instruction: string) {
    if (!result) {
      return;
    }

    setRefining(true);
    setError(null);

    try {
      const next = await refinePlan({
        sessionId: result.sessionId,
        instruction,
      });

      setResult(next);
      setRefineInstruction(instruction);
      startTransition(() => {
        router.replace(`/plan?share=${next.shareId}`);
      });
    } catch (refineError) {
      setError(refineError instanceof Error ? refineError.message : "调整路线失败");
    } finally {
      setRefining(false);
    }
  }

  if (!shareId) {
    return (
      <Surface className="p-6 text-[#5f5045]">
        <p className="text-lg text-[#21170f]">还没有可展示的路线。</p>
        <p className="mt-3 text-sm leading-7">
          先回到首页说说你想怎么逛，生成完成后就会跳到这里。
        </p>
      </Surface>
    );
  }

  if (loading) {
    return (
      <div className="grid min-h-96 place-items-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-[#8a5e2e]" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <Surface className="p-6">
        <p className="text-lg text-[#a43f35]">结果页加载失败</p>
        <p className="mt-3 text-sm text-[#5f5045]">{error ?? "未找到分享结果。"}</p>
      </Surface>
    );
  }

  return (
    <div className="space-y-8">
      <Surface className="overflow-hidden">
        <div className="space-y-8 p-6 md:p-8">
          <div className="space-y-4">
            <Pill>{result.userProfile.days} 天路线</Pill>
            <p className="text-xs uppercase tracking-[0.28em] text-[#8b765b]">这次先讲感觉，再看怎么走</p>
            <div className="space-y-4">
              <h1 className="zh-heading max-w-4xl font-serif text-[clamp(2.25rem,5vw,3rem)] leading-[1.12] text-[#1d221e]">
                {result.tripTitle}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-[#4f4c45]">{result.summary}</p>
              <p className="max-w-3xl text-sm leading-8 text-[#6a665c]">{result.whyThisPlan}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="总预算" value={`¥${result.budget.total}`} />
            <Metric label="交通方式" value={result.userProfile.transportMode} />
            <Metric label="节奏" value={result.userProfile.pace} />
          </div>

          {heroVisual ? (
            <div className="bg-[#f3eee6] p-3">
              <div
                className="min-h-[360px] rounded-[28px] bg-cover bg-center"
                style={{
                  backgroundImage: heroVisual.image
                    ? `linear-gradient(180deg, rgba(18,18,18,0.1), rgba(18,18,18,0.52)), url('${heroVisual.image}')`
                    : "linear-gradient(180deg, #d8d2c6, #eee8df)",
                }}
              >
                <div className="flex min-h-[360px] flex-col justify-end p-6 text-white">
                  <Pill className="w-fit border-white/30 bg-black/20 text-white">
                    {heroVisual.district}
                  </Pill>
                  <h2 className="mt-4 font-serif text-3xl">{heroVisual.name}</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/88">
                    {heroVisual.summary}
                  </p>
                </div>
              </div>

              {highlights.length > 1 ? (
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {highlights.slice(1, 4).map(({ dayIndex, segment, visual }) => (
                    <div
                      key={`${dayIndex}-${segment.entityId}-${segment.startTime}`}
                      className="overflow-hidden rounded-[22px] border border-white/50 bg-white/70"
                    >
                      <div
                        className="h-28 bg-cover bg-center"
                        style={{
                          backgroundImage: visual?.image
                            ? `linear-gradient(180deg, rgba(19,19,18,0.06), rgba(19,19,18,0.3)), url('${visual.image}')`
                            : "linear-gradient(180deg, #d8d2c6, #eee8df)",
                        }}
                      />
                      <div className="space-y-2 p-4">
                        <Pill>第 {dayIndex} 天</Pill>
                        <h3 className="font-semibold text-[#1d221e]">{segment.title}</h3>
                        <p className="text-sm leading-6 text-[#626056]">{visual?.summary ?? segment.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-[24px] border border-[#ddd4c8] bg-[#f7f2eb] p-4">
            <div className="flex flex-wrap gap-2">
              {["减少步行", "预算压到 300 元以内", "把美食占比提高", "增加文化讲解"].map(
                (preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleRefine(preset)}
                    disabled={refining}
                    className="rounded-full border border-[#ddd4c8] bg-white px-4 py-2 text-sm text-[#4d4a43] transition hover:border-[#8f7d61]"
                  >
                    {preset}
                  </button>
                ),
              )}
            </div>

            <div className="mt-4 rounded-[20px] border border-[#ddd4c8] bg-white p-4">
              <div className="flex items-center gap-2 text-[#8b765b]">
                <Sparkles className="h-4 w-4" />
                <p className="text-sm">补一句想法，再细调一次</p>
              </div>
              <textarea
                value={refineInstruction}
                onChange={(event) => setRefineInstruction(event.target.value)}
                className="mt-3 min-h-24 w-full rounded-2xl border border-[#ddd4c8] bg-[#fbfaf7] px-4 py-3 text-sm outline-none"
              />
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleRefine(refineInstruction)}
                  disabled={refining}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1f2722] px-4 py-2 text-sm font-medium text-[#f7f5f1]"
                >
                  {refining ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Route className="h-4 w-4" />
                  )}
                  重新规划
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(window.location.href);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d7cec0] bg-white px-4 py-2 text-sm text-[#1d221e]"
                >
                  <Copy className="h-4 w-4" />
                  复制分享链接
                </button>
              </div>
            </div>
          </div>
        </div>
      </Surface>

      <Surface className="p-5">
        <SectionHeading
          eyebrow="Map"
          title="路线地图"
          description="先看一眼点位和顺序，再往下看每天怎么走。"
        />
        <div className="mt-5">
          <RouteMap
            points={mapPoints}
            transportMode={result.userProfile.transportMode}
          />
        </div>
      </Surface>

      <div className="space-y-6">
        {result.days.map((day) => (
          <Surface key={day.dayIndex} className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#876446]">
                  Day {day.dayIndex}
                </p>
                <h3 className="mt-2 font-serif text-2xl text-[#21170f]">
                  {day.theme}
                </h3>
              </div>
              <Pill>预计 ¥{day.estimatedCost}</Pill>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[#676256]">
              {buildDayLead(day)}
            </p>
            <div className="mt-6 space-y-4">
              {day.segments.map((segment) => (
                isStorySegment(segment) ? (
                  <div
                    key={`${day.dayIndex}-${segment.startTime}-${segment.title}`}
                    className="overflow-hidden rounded-[24px] border border-[#eadfd2] bg-[#fffdfa]"
                  >
                    <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                      {getVisualBySegment(segment)?.image ? (
                        <div
                          className="min-h-52 bg-cover bg-center"
                          style={{
                            backgroundImage: `linear-gradient(180deg, rgba(19,19,18,0.08), rgba(19,19,18,0.34)), url('${getVisualBySegment(segment)?.image}')`,
                          }}
                        />
                      ) : (
                        <div className="min-h-52 bg-[#eee8df]" />
                      )}
                      <div className="space-y-3 p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill>{segment.entityType === "poi" ? "景点" : "吃饭"}</Pill>
                          <span className="text-sm text-[#7a5334]">
                            {segment.startTime} - {segment.endTime}
                          </span>
                        </div>
                        <h4 className="font-serif text-2xl text-[#21170f]">{segment.title}</h4>
                        <p className="text-base leading-8 text-[#4e4941]">{segment.reason}</p>
                        {getVisualBySegment(segment)?.intro ? (
                          <p className="text-sm leading-7 text-[#7a6a5d]">
                            {getVisualBySegment(segment)?.intro}
                          </p>
                        ) : null}
                        {segment.transportSuggestion ? (
                          <p className="text-xs text-[#876446]">
                            交通建议：{segment.transportSuggestion}
                          </p>
                        ) : null}
                        {segment.warning ? (
                          <p className="text-xs text-[#a43f35]">提示：{segment.warning}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={`${day.dayIndex}-${segment.startTime}-${segment.title}`}
                    className="rounded-full border border-[#eadfd2] bg-[#faf5ee] px-4 py-3 text-sm text-[#7a6a5d]"
                  >
                    <span className="font-medium text-[#7a5334]">
                      {segment.startTime} - {segment.endTime}
                    </span>
                    {" · "}
                    {segment.title}
                  </div>
                )
              ))}
            </div>
          </Surface>
        ))}
      </div>

      <Surface className="p-5">
        <SectionHeading
          eyebrow="Alternatives"
          title="替代方案"
          description="如果临时想走得更轻松，或者天气变了，这里还有别的走法。"
        />
        <div className="mt-5 space-y-3">
          {result.alternatives.map((item) => (
            <div key={item.type} className="rounded-[22px] border border-[#ead9c0] bg-[#fffdf8] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[#876446]">
                {item.type}
              </p>
              <p className="mt-2 text-sm leading-7 text-[#5f5045]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Surface>

      <Surface className="p-5">
        <SectionHeading eyebrow="Warnings" title="风险提示" />
        <ul className="mt-5 space-y-3 text-sm leading-7 text-[#5f5045]">
          {result.warnings.map((warning) => (
            <li key={warning} className="rounded-[22px] border border-[#ead9c0] bg-[#fffdf8] px-4 py-3">
              {warning}
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
