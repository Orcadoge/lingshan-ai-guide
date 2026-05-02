import type {
  AdminUpsertFoodVenueInput,
  AdminUpsertPoiInput,
  DirectoryFoodItem,
  FeedbackInput,
  PlanIntent,
  PlanResult,
  PromptConfig,
} from "@handan/shared";
import { Prisma } from "@prisma/client";

import { prisma } from "./client";

function toDateLabel(value: Date) {
  return value.toISOString().slice(0, 10);
}

function mapPoi(record: Awaited<ReturnType<typeof prisma.poi.findFirstOrThrow>>) {
  return {
    ...record,
    freshnessDate: toDateLabel(record.freshnessDate),
  };
}

function mapFoodVenue(
  record: Awaited<ReturnType<typeof prisma.foodVenue.findFirstOrThrow>>,
) {
  return {
    ...record,
    freshnessDate: toDateLabel(record.freshnessDate),
  };
}

function mapDish(record: Awaited<ReturnType<typeof prisma.dish.findFirstOrThrow>>) {
  return {
    ...record,
    freshnessDate: toDateLabel(record.freshnessDate),
  };
}

function mapTheme(record: Awaited<ReturnType<typeof prisma.theme.findFirstOrThrow>>) {
  return record;
}

export async function getApprovedPois(filters?: {
  district?: string;
  theme?: string;
  q?: string;
}) {
  const items = await prisma.poi.findMany({
    where: {
      reviewStatus: "APPROVED",
      ...(filters?.district ? { district: filters.district } : {}),
      ...(filters?.theme ? { themeSlugs: { has: filters.theme } } : {}),
      ...(filters?.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" } },
              { tags: { has: filters.q } },
            ],
          }
        : {}),
    },
    orderBy: [{ level: "desc" }, { name: "asc" }],
  });

  return items.map((item) => ({
    ...item,
    freshnessDate: toDateLabel(item.freshnessDate),
  }));
}

export async function getPoiBySlug(slug: string) {
  const item = await prisma.poi.findUniqueOrThrow({ where: { slug } });
  return mapPoi(item);
}

export async function getApprovedFoodVenues(filters?: {
  district?: string;
  theme?: string;
  q?: string;
}) {
  const items = await prisma.foodVenue.findMany({
    where: {
      reviewStatus: "APPROVED",
      ...(filters?.district ? { district: filters.district } : {}),
      ...(filters?.theme ? { themeSlugs: { has: filters.theme } } : {}),
      ...(filters?.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" } },
              { tags: { has: filters.q } },
            ],
          }
        : {}),
    },
    orderBy: [{ avgPrice: "asc" }, { name: "asc" }],
  });

  return items.map(mapFoodVenue);
}

export async function getApprovedDishes(filters?: {
  district?: string;
  theme?: string;
  q?: string;
}) {
  const items = await prisma.dish.findMany({
    where: {
      reviewStatus: "APPROVED",
      ...(filters?.district ? { district: filters.district } : {}),
      ...(filters?.theme ? { themeSlugs: { has: filters.theme } } : {}),
      ...(filters?.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" } },
              { tags: { has: filters.q } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  return items.map(mapDish);
}

export async function getFoodCatalog(filters?: {
  district?: string;
  theme?: string;
  q?: string;
}) {
  const [venues, dishes] = await Promise.all([
    getApprovedFoodVenues(filters),
    getApprovedDishes(filters),
  ]);

  const catalog: DirectoryFoodItem[] = [
    ...venues.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      kind: "venue" as const,
      district: item.district,
      intro: item.intro,
      tags: item.tags,
      priceLabel: `人均 ${item.avgPrice} 元`,
      bestTimeToEat: item.bestTimeToEat,
    })),
    ...dishes.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      kind: "dish" as const,
      district: item.district,
      intro: item.intro,
      tags: item.tags,
      priceLabel: null,
      bestTimeToEat: item.bestTimeToEat,
    })),
  ];

  return catalog;
}

export async function getFoodDetailBySlug(slug: string) {
  const venue = await prisma.foodVenue.findUnique({ where: { slug } });
  if (venue) {
    return { kind: "venue" as const, item: mapFoodVenue(venue) };
  }

  const dish = await prisma.dish.findUniqueOrThrow({ where: { slug } });
  return { kind: "dish" as const, item: mapDish(dish) };
}

export async function getThemes() {
  return prisma.theme.findMany({ orderBy: { name: "asc" } });
}

export async function getThemeDetail(slug: string) {
  const [theme, pois, foodVenues, dishes] = await Promise.all([
    prisma.theme.findUniqueOrThrow({ where: { slug } }),
    prisma.poi.findMany({
      where: { reviewStatus: "APPROVED", themeSlugs: { has: slug } },
      orderBy: { name: "asc" },
    }),
    prisma.foodVenue.findMany({
      where: { reviewStatus: "APPROVED", themeSlugs: { has: slug } },
      orderBy: { name: "asc" },
    }),
    prisma.dish.findMany({
      where: { reviewStatus: "APPROVED", themeSlugs: { has: slug } },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    ...mapTheme(theme),
    pois: pois.map(mapPoi),
    foodVenues: foodVenues.map(mapFoodVenue),
    dishes: dishes.map(mapDish),
  };
}

export async function getPublishedPromptConfigs(): Promise<PromptConfig[]> {
  return prisma.promptConfig.findMany({
    where: { isPublished: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAllPromptConfigs() {
  return prisma.promptConfig.findMany({ orderBy: { updatedAt: "desc" } });
}

export async function publishPromptConfig(id: string) {
  return prisma.promptConfig.update({
    where: { id },
    data: { isPublished: true },
  });
}

export async function upsertPoi(input: AdminUpsertPoiInput & { id?: string }) {
  const data = {
    ...input,
    freshnessDate: new Date(input.freshnessDate),
  };

  if (input.id) {
    return prisma.poi.update({
      where: { id: input.id },
      data,
    });
  }

  return prisma.poi.create({
    data: {
      ...data,
      id: crypto.randomUUID(),
      themeSlugs: [],
      nearbyFoodIds: [],
    },
  });
}

export async function upsertFoodVenue(
  input: AdminUpsertFoodVenueInput & { id?: string },
) {
  const data = {
    ...input,
    freshnessDate: new Date(input.freshnessDate),
  };

  if (input.id) {
    return prisma.foodVenue.update({
      where: { id: input.id },
      data,
    });
  }

  return prisma.foodVenue.create({
    data: {
      ...data,
      id: crypto.randomUUID(),
      themeSlugs: [],
    },
  });
}

export async function createPlanSession(args: {
  id: string;
  shareId: string;
  intent: PlanIntent;
  result: PlanResult;
  modelMeta: Record<string, unknown>;
}) {
  return prisma.planSession.create({
    data: {
      id: args.id,
      shareId: args.shareId,
      inputPayload: args.intent as Prisma.InputJsonValue,
      parsedIntent: args.intent as Prisma.InputJsonValue,
      resultPayload: args.result as Prisma.InputJsonValue,
      modelMeta: args.modelMeta as Prisma.InputJsonValue,
    },
  });
}

export async function getPlanSessionByShareId(shareId: string) {
  return prisma.planSession.findUniqueOrThrow({ where: { shareId } });
}

export async function getPlanSessionById(id: string) {
  return prisma.planSession.findUniqueOrThrow({ where: { id } });
}

export async function createFeedback(input: FeedbackInput) {
  return prisma.userFeedback.create({
    data: {
      id: crypto.randomUUID(),
      planSessionId: input.planSessionId,
      rating: input.rating,
      useful: input.useful,
      comment: input.comment ?? null,
    },
  });
}

export async function searchDirectory(query: string) {
  const [pois, foods, themes] = await Promise.all([
    getApprovedPois({ q: query }),
    getFoodCatalog({ q: query }),
    prisma.theme.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { intro: { contains: query, mode: "insensitive" } },
        ],
      },
    }),
  ]);

  return { pois, foods, themes };
}

export async function healthcheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, database: true };
  } catch {
    return { ok: false, database: false };
  }
}
