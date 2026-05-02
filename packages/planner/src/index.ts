import type {
  Dish,
  FoodVenue,
  PlanIntent,
  PlanResult,
  Poi,
  Theme,
} from "@handan/shared";

type PlannerInput = {
  intent: PlanIntent;
  pois: Poi[];
  foodVenues: FoodVenue[];
  dishes: Dish[];
  themes: Theme[];
  aiSuggestions?: PlannerAiSuggestions;
};

export type PlannerAiSuggestions = {
  poiPriorityIds?: string[];
  foodVenuePriorityIds?: string[];
  narrative?: {
    tripTitle?: string;
    summary?: string;
    whyThisPlan?: string;
    dayThemes?: string[];
    alternatives?: PlanResult["alternatives"];
    warnings?: string[];
    segmentReasons?: Record<string, string>;
  };
};

const INTEREST_TAG_MAP: Record<string, string[]> = {
  history: ["历史", "赵文化", "成语文化", "遗址", "考古"],
  mountain: ["山水", "自然", "湖", "峡谷", "登山"],
  taiji: ["太极", "广府", "文化"],
  red: ["红色文化", "革命"],
  citywalk: ["citywalk", "街区", "夜游", "市区"],
  food: ["美食", "小吃", "非遗", "名吃"],
  photo: ["拍照", "夜景", "山水", "古城"],
};

const PACE_POI_LIMIT: Record<PlanIntent["pace"], number> = {
  relaxed: 2,
  standard: 3,
  compact: 4,
};

const DAY_THEME_LABEL: Record<string, string> = {
  "idiom-culture": "成语与赵都印象",
  "zhao-culture": "战国赵文化深度游",
  "taiji-culture": "太极文化与古城慢游",
  "red-culture": "红色记忆联线",
  "grotto-archaeology": "石窟与考古遗址串游",
  "mountain-leisure": "山水休闲舒展线",
  citywalk: "市区 citywalk",
  "night-food": "夜游与风味觅食",
  "family-friendly": "亲子友好节奏线",
  "senior-friendly": "老人友好轻松线",
};

function normalizeBudget(intent: PlanIntent): number {
  if (intent.budgetAmount) {
    return intent.budgetAmount;
  }

  switch (intent.budgetLevel) {
    case "low":
      return 300;
    case "medium":
      return 600;
    case "high":
      return 1000;
    default:
      return 600;
  }
}

function haversineDistanceKm(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(end.lat - start.lat);
  const dLng = toRad(end.lng - start.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(start.lat)) *
      Math.cos(toRad(end.lat)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * earth * Math.asin(Math.sqrt(a));
}

function estimateTransferMinutes(
  distanceKm: number,
  mode: PlanIntent["transportMode"],
): number {
  if (mode === "walk-first") {
    return Math.max(15, Math.round(distanceKm * 14));
  }

  if (mode === "public") {
    return Math.max(20, Math.round(distanceKm * 5 + 15));
  }

  if (mode === "taxi") {
    return Math.max(12, Math.round(distanceKm * 2.5 + 8));
  }

  return Math.max(15, Math.round(distanceKm * 2.2 + 6));
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = (hours ?? 0) * 60 + (mins ?? 0) + minutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  const nextHours = Math.floor(normalized / 60);
  const nextMinutes = normalized % 60;

  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function startTimeFromConstraints(intent: PlanIntent): string {
  const lateStart = intent.constraints.some((constraint) =>
    /不能太早|不要太早|晚点出门/.test(constraint),
  );

  return lateStart ? "10:00" : "09:00";
}

function buildPriorityMap(priorityIds?: string[]): Map<string, number> {
  return new Map((priorityIds ?? []).map((id, index) => [id, index]));
}

function getPriorityBoost(id: string, priorityMap: Map<string, number>): number {
  const index = priorityMap.get(id);

  if (index === undefined) {
    return 0;
  }

  return Math.max(0, 180 - index * 24);
}

function scorePoi(
  poi: Poi,
  intent: PlanIntent,
  priorityMap: Map<string, number>,
): number {
  const interestBoost = intent.interests.reduce((score, interest) => {
    const keywords = INTEREST_TAG_MAP[interest] ?? [];
    const matched = keywords.filter((keyword) =>
      poi.tags.some((tag) => tag.includes(keyword)),
    ).length;

    return score + matched * 12;
  }, 0);

  const crowdBoost = intent.companions.some((companion) =>
    poi.suitableCrowd.includes(companion),
  )
    ? 10
    : 0;

  const mustVisitBoost = intent.mustVisitSlugs.includes(poi.slug) ? 60 : 0;
  const cityBoost =
    intent.constraints.some((constraint) => /市区/.test(constraint)) &&
    poi.tags.some((tag) => tag.includes("市区"))
      ? 18
      : 0;

  const lowWalkingPenalty =
    intent.constraints.some((constraint) => /少走路|老人|亲子/.test(constraint)) &&
    poi.tags.some((tag) => tag.includes("爬坡") || tag.includes("高强度"))
      ? -20
      : 0;

  return (
    interestBoost +
    crowdBoost +
    mustVisitBoost +
    cityBoost +
    lowWalkingPenalty +
    getPriorityBoost(poi.id, priorityMap)
  );
}

function pickPrimaryTheme(intent: PlanIntent, themes: Theme[]): string {
  const byInterest = new Map<string, string>([
    ["history", "zhao-culture"],
    ["mountain", "mountain-leisure"],
    ["taiji", "taiji-culture"],
    ["red", "red-culture"],
    ["citywalk", "citywalk"],
    ["food", "night-food"],
    ["photo", "mountain-leisure"],
  ]);

  const slug = byInterest.get(intent.interests[0] ?? "history") ?? "zhao-culture";
  return themes.find((theme) => theme.slug === slug)?.name ?? DAY_THEME_LABEL[slug] ?? "赵文化深度游";
}

function pickFoodVenue(
  poi: Poi,
  foodVenues: FoodVenue[],
  budgetPerMeal: number,
  priorityMap: Map<string, number>,
): FoodVenue | null {
  const budgetCap = budgetPerMeal * 1.8;
  const candidates = foodVenues.filter((venue) => venue.avgPrice <= budgetCap);
  const rankedCandidates = (candidates.length ? candidates : foodVenues).toSorted(
    (left, right) => {
      const score = (venue: FoodVenue) => {
        const nearbyBoost = poi.nearbyFoodIds.includes(venue.id) ? 80 : 0;
        const districtBoost = venue.district === poi.district ? 30 : 0;
        const budgetPenalty = Math.abs(venue.avgPrice - budgetPerMeal);
        return (
          nearbyBoost +
          districtBoost +
          getPriorityBoost(venue.id, priorityMap) -
          budgetPenalty
        );
      };

      return score(right) - score(left);
    },
  );

  return rankedCandidates[0] ?? null;
}

function buildAlternatives(intent: PlanIntent): PlanResult["alternatives"] {
  const alternatives: PlanResult["alternatives"] = [];

  if (!intent.constraints.some((constraint) => /雨/.test(constraint))) {
    alternatives.push({
      type: "rainy_day",
      description: "若遇雨天，可优先替换为博物馆、公园或古城街区内的室内讲解点位。",
    });
  }

  if (intent.pace !== "relaxed") {
    alternatives.push({
      type: "less_walking",
      description: "想减少步行时，可把远距景点替换为同城区点位，并优先使用打车衔接。",
    });
  }

  alternatives.push({
    type: "budget",
    description: "若预算继续收紧，优先保留核心景点并将正餐替换为均价更低的本地名吃组合。",
  });

  return alternatives;
}

function buildWarnings(
  intent: PlanIntent,
  selectedPois: Poi[],
  foodVenues: FoodVenue[],
): string[] {
  const warnings: string[] = [];

  if (selectedPois.length < Math.ceil(intent.durationDays)) {
    warnings.push("当前满足条件的核心景点较少，系统已降级为保守路线，请考虑放宽主题或交通约束。");
  }

  if (foodVenues.length === 0) {
    warnings.push("当前路线未匹配到合适门店，建议到站后再次确认营业时段。");
  }

  if (intent.transportMode === "public") {
    warnings.push("公交模式已按保守换乘估算，请出发前结合实时路线再次确认。");
  }

  if (intent.constraints.some((constraint) => /雨/.test(constraint))) {
    warnings.push("雨天模式建议优先准备替代室内点位，山区线路需关注临时开放情况。");
  }

  return warnings;
}

function buildSummary(
  intent: PlanIntent,
  themeLabel: string,
  budget: number,
): { title: string; summary: string; why: string } {
  const dayLabel = intent.durationDays === 0.5 ? "半日" : `${intent.durationDays}日`;
  const companions = intent.companions.join("、");
  const title = `在邯郸的${dayLabel}：${themeLabel}`;
  const summary = `这条线把更值得停留的地方、顺路能吃到的本地味道和更舒服的移动顺序排在了一起，适合${companions}出行。`;
  const why = `预算先按 ${budget} 元的尺度留出余量，再把景点停留和中途吃饭嵌进同一条动线里，所以走起来会更从容。`;

  return { title, summary, why };
}

function buildSources(
  pois: Poi[],
  foodVenues: FoodVenue[],
): PlanResult["sources"] {
  return [...pois, ...foodVenues].map((entity) => ({
    entityId: entity.id,
    sourceType: "official" as const,
    freshnessDate: entity.freshnessDate,
  }));
}

export function generatePlan({
  intent,
  pois,
  foodVenues,
  themes,
  aiSuggestions,
}: PlannerInput): Omit<PlanResult, "sessionId" | "shareId"> {
  const budget = normalizeBudget(intent);
  const dailyBudget = Math.max(120, Math.floor(budget / Math.max(1, intent.durationDays)));
  const maxPoiPerDay = PACE_POI_LIMIT[intent.pace] ?? 3;
  const poiPriorityMap = buildPriorityMap(aiSuggestions?.poiPriorityIds);
  const foodVenuePriorityMap = buildPriorityMap(aiSuggestions?.foodVenuePriorityIds);
  const segmentReasons = aiSuggestions?.narrative?.segmentReasons ?? {};
  const selectedPois = [...pois]
    .sort(
      (left, right) =>
        scorePoi(right, intent, poiPriorityMap) - scorePoi(left, intent, poiPriorityMap),
    )
    .slice(0, Math.max(2, Math.ceil(intent.durationDays) * maxPoiPerDay));

  const days: PlanResult["days"] = [];
  const dayCount = Math.max(1, Math.ceil(intent.durationDays));
  const primaryTheme = pickPrimaryTheme(intent, themes);

  let ticketBudget = 0;
  let transportBudget = 0;
  let foodBudget = 0;

  for (let dayIndex = 1; dayIndex <= dayCount; dayIndex += 1) {
    const startIndex = (dayIndex - 1) * maxPoiPerDay;
    const endIndex = dayIndex * maxPoiPerDay;
    const dayPois = selectedPois.slice(
      startIndex,
      endIndex,
    );

    const segments: PlanResult["days"][number]["segments"] = [];
    let cursor = startTimeFromConstraints(intent);
    let previousPoi: Poi | null = null;

    dayPois.forEach((poi, poiIndex) => {
      if (previousPoi) {
        const distance = haversineDistanceKm(previousPoi, poi);
        const transferMinutes = estimateTransferMinutes(distance, intent.transportMode);
        segments.push({
          startTime: cursor,
          endTime: addMinutesToTime(cursor, transferMinutes),
          type: "transfer",
          entityId: `transfer-${dayIndex}-${poiIndex}`,
          entityType: "system",
          title: `${intent.transportMode === "public" ? "公共交通" : "路程衔接"}前往 ${poi.name}`,
          reason: "系统已把点位移动时间纳入日程，避免只算停留时长造成行程拥挤。",
          stayMinutes: transferMinutes,
          transportSuggestion: `${Math.round(distance)} 公里，建议 ${intent.transportMode === "public" ? "优先公交或打车接驳" : "按导航前往"}`,
          warning: null,
        });
        cursor = addMinutesToTime(cursor, transferMinutes);
        transportBudget += Math.max(8, Math.round(distance * 3.5));
      }

      const stayMinutes = poi.recommendStayMinutes;
      segments.push({
        startTime: cursor,
        endTime: addMinutesToTime(cursor, stayMinutes),
        type: "poi",
        entityId: poi.id,
        entityType: "poi",
        title: poi.name,
        reason:
          segmentReasons[poi.id] ??
          `这段优先安排 ${poi.name}，因为它与 ${primaryTheme} 和当前用户偏好匹配度较高。`,
        stayMinutes,
        transportSuggestion: poi.transportTips,
        warning: poi.openingHours ? null : "请出发前确认最新开放时段。",
      });
      cursor = addMinutesToTime(cursor, stayMinutes);

      const ticket = Number.parseInt(poi.ticketPriceRange?.replace(/[^\d]/g, "") ?? "0", 10) || 0;
      ticketBudget += ticket;

      const shouldInsertLunch = poiIndex === 0;
      const shouldInsertDinner = poiIndex === dayPois.length - 1;
      const selectedFood = pickFoodVenue(
        poi,
        foodVenues,
        dailyBudget / 2,
        foodVenuePriorityMap,
      );

      if (selectedFood && (shouldInsertLunch || shouldInsertDinner)) {
        const mealMinutes = shouldInsertLunch ? 60 : 75;
        segments.push({
          startTime: cursor,
          endTime: addMinutesToTime(cursor, mealMinutes),
          type: "food",
          entityId: selectedFood.id,
          entityType: "foodVenue",
          title: selectedFood.name,
          reason:
            segmentReasons[selectedFood.id] ??
            `安排 ${selectedFood.name}，是因为它与 ${poi.name} 同区或可顺路衔接，且保留了本地风味表达。`,
          stayMinutes: mealMinutes,
          transportSuggestion: "建议提前确认门店营业时段和高峰排队情况。",
          warning: selectedFood.openingHours ? null : "该门店营业时段待再次确认。",
        });
        cursor = addMinutesToTime(cursor, mealMinutes);
        foodBudget += selectedFood.avgPrice;
      }

      previousPoi = poi;
    });

    days.push({
      dayIndex,
      theme: aiSuggestions?.narrative?.dayThemes?.[dayIndex - 1] ?? primaryTheme,
      estimatedCost: Math.max(80, Math.round((ticketBudget + foodBudget + transportBudget) / dayIndex)),
      segments,
    });
  }

  const { title, summary, why } = buildSummary(intent, primaryTheme, budget);

  return {
    tripTitle: aiSuggestions?.narrative?.tripTitle ?? title,
    summary: aiSuggestions?.narrative?.summary ?? summary,
    whyThisPlan: aiSuggestions?.narrative?.whyThisPlan ?? why,
    userProfile: {
      days: intent.durationDays,
      budget,
      transportMode: intent.transportMode,
      pace: intent.pace,
      companions: intent.companions,
    },
    days,
    budget: {
      tickets: ticketBudget,
      food: foodBudget,
      transport: transportBudget,
      total: ticketBudget + foodBudget + transportBudget,
    },
    alternatives:
      aiSuggestions?.narrative?.alternatives?.length
        ? aiSuggestions.narrative.alternatives
        : buildAlternatives(intent),
    warnings:
      aiSuggestions?.narrative?.warnings?.length
        ? aiSuggestions.narrative.warnings
        : buildWarnings(intent, selectedPois, foodVenues),
    sources: buildSources(selectedPois, foodVenues),
  };
}
