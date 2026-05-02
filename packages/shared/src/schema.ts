import { z } from "zod";

import {
  BUDGET_LEVELS,
  COMPANION_OPTIONS,
  DISTRICTS,
  ENTITY_TYPES,
  FOOD_TASTE_OPTIONS,
  INTEREST_OPTIONS,
  PACE_OPTIONS,
  PLAN_ALTERNATIVE_TYPES,
  REVIEW_STATUS_OPTIONS,
  SEGMENT_TYPES,
  THEME_OPTIONS,
  TRANSPORT_OPTIONS,
} from "./constants";

export const reviewStatusSchema = z.enum(REVIEW_STATUS_OPTIONS);
export const transportModeSchema = z.enum(TRANSPORT_OPTIONS);
export const companionSchema = z.enum(COMPANION_OPTIONS);
export const paceSchema = z.enum(PACE_OPTIONS);
export const interestSchema = z.enum(INTEREST_OPTIONS);
export const foodTasteSchema = z.enum(FOOD_TASTE_OPTIONS);
export const budgetLevelSchema = z.enum(BUDGET_LEVELS);
export const segmentTypeSchema = z.enum(SEGMENT_TYPES);
export const entityTypeSchema = z.enum(ENTITY_TYPES);
export const alternativeTypeSchema = z.enum(PLAN_ALTERNATIVE_TYPES);
export const themeSlugSchema = z.enum(THEME_OPTIONS);

export const sourceRecordSchema = z.object({
  id: z.string(),
  sourceType: z.enum(["official", "audited", "media", "encyclopedia"]),
  title: z.string(),
  url: z.url(),
  publisher: z.string(),
  publishedAt: z.string().nullable(),
  fetchedAt: z.string(),
});

export const baseDirectorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  district: z.enum(DISTRICTS).or(z.string()),
  tags: z.array(z.string()).default([]),
  themeSlugs: z.array(themeSlugSchema).default([]),
  intro: z.string(),
  sourceId: z.string(),
  freshnessDate: z.string(),
  reviewStatus: reviewStatusSchema,
});

export const poiSchema = baseDirectorySchema.extend({
  level: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  culturalStory: z.string().nullable(),
  recommendStayMinutes: z.number().int().positive(),
  openingHours: z.string().nullable(),
  ticketPriceRange: z.string().nullable(),
  suitableCrowd: z.array(z.string()).default([]),
  transportTips: z.string().nullable(),
  nearbyFoodIds: z.array(z.string()).default([]),
});

export const foodVenueSchema = baseDirectorySchema.extend({
  lat: z.number(),
  lng: z.number(),
  avgPrice: z.number().nonnegative(),
  spicyLevel: z.enum(["none", "mild", "medium", "high"]),
  openingHours: z.string().nullable(),
  signatureDishes: z.array(z.string()).default([]),
  suitableCrowd: z.array(z.string()).default([]),
  cultureStory: z.string().nullable(),
  bestTimeToEat: z.string().nullable(),
});

export const dishSchema = baseDirectorySchema.extend({
  flavor: z.string(),
  cultureTags: z.array(z.string()).default([]),
  relatedVenueIds: z.array(z.string()).default([]),
  bestTimeToEat: z.string().nullable(),
  suitableCrowd: z.array(z.string()).default([]),
  spicyLevel: z.enum(["none", "mild", "medium", "high"]),
});

export const themeSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: themeSlugSchema,
  intro: z.string(),
  seoText: z.string(),
  heroImage: z.string(),
  featureBullets: z.array(z.string()).default([]),
});

export const planIntentSchema = z.object({
  originalQuery: z.string().min(4),
  durationDays: z.union([
    z.literal(0.5),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  transportMode: transportModeSchema,
  companions: z.array(companionSchema).min(1),
  budgetLevel: budgetLevelSchema,
  budgetAmount: z.number().int().positive().nullable().default(null),
  interests: z.array(interestSchema).min(1),
  foodPreferences: z.array(foodTasteSchema).default([]),
  pace: paceSchema,
  constraints: z.array(z.string()).default([]),
  mustVisitSlugs: z.array(z.string()).default([]),
});

export const generatePlanRequestSchema = z.object({
  intent: planIntentSchema,
});

export const refinePlanRequestSchema = z.object({
  sessionId: z.string(),
  instruction: z.string().min(2),
});

export const planSegmentSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  type: segmentTypeSchema,
  entityId: z.string(),
  entityType: entityTypeSchema,
  title: z.string(),
  reason: z.string(),
  stayMinutes: z.number().int().nonnegative(),
  transportSuggestion: z.string().nullable(),
  warning: z.string().nullable(),
});

export const planDaySchema = z.object({
  dayIndex: z.number().int().positive(),
  theme: z.string(),
  estimatedCost: z.number().nonnegative(),
  segments: z.array(planSegmentSchema).min(1),
});

export const budgetSummarySchema = z.object({
  transport: z.number().nonnegative(),
  tickets: z.number().nonnegative(),
  food: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const planAlternativeSchema = z.object({
  type: alternativeTypeSchema,
  description: z.string(),
});

export const planResultSchema = z.object({
  sessionId: z.string(),
  shareId: z.string(),
  tripTitle: z.string(),
  summary: z.string(),
  whyThisPlan: z.string(),
  userProfile: z.object({
    days: z.number(),
    budget: z.number(),
    transportMode: transportModeSchema,
    pace: paceSchema,
    companions: z.array(companionSchema),
  }),
  days: z.array(planDaySchema).min(1),
  budget: budgetSummarySchema,
  alternatives: z.array(planAlternativeSchema).default([]),
  warnings: z.array(z.string()).default([]),
  sources: z.array(
    z.object({
      entityId: z.string(),
      sourceType: z.enum(["official", "audited", "media", "encyclopedia"]),
      freshnessDate: z.string(),
    }),
  ),
});

export const planSessionSchema = z.object({
  id: z.string(),
  shareId: z.string(),
  inputPayload: z.record(z.string(), z.unknown()),
  parsedIntent: planIntentSchema,
  resultPayload: planResultSchema,
  modelMeta: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

export const feedbackSchema = z.object({
  planSessionId: z.string(),
  rating: z.number().min(1).max(5),
  useful: z.boolean(),
  comment: z.string().max(500).nullable().default(null),
});

export const searchQuerySchema = z.object({
  q: z.string().default(""),
  theme: z.string().optional(),
  district: z.string().optional(),
  duration: z.coerce.number().optional(),
});

export const directoryFoodItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  kind: z.enum(["venue", "dish"]),
  district: z.string(),
  intro: z.string(),
  tags: z.array(z.string()),
  priceLabel: z.string().nullable(),
  bestTimeToEat: z.string().nullable(),
});

export const themeDetailSchema = themeSchema.extend({
  pois: z.array(poiSchema),
  foodVenues: z.array(foodVenueSchema),
  dishes: z.array(dishSchema),
});

export const adminUpsertPoiSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  district: z.string().min(2),
  level: z.string().nullable().default(null),
  lat: z.number(),
  lng: z.number(),
  tags: z.array(z.string()).default([]),
  intro: z.string(),
  culturalStory: z.string().nullable().default(null),
  recommendStayMinutes: z.number().int().positive(),
  openingHours: z.string().nullable().default(null),
  ticketPriceRange: z.string().nullable().default(null),
  suitableCrowd: z.array(z.string()).default([]),
  transportTips: z.string().nullable().default(null),
  sourceId: z.string(),
  freshnessDate: z.string(),
  reviewStatus: reviewStatusSchema,
});

export const adminUpsertFoodVenueSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  district: z.string().min(2),
  lat: z.number(),
  lng: z.number(),
  avgPrice: z.number().nonnegative(),
  spicyLevel: z.enum(["none", "mild", "medium", "high"]),
  tags: z.array(z.string()).default([]),
  intro: z.string(),
  openingHours: z.string().nullable().default(null),
  signatureDishes: z.array(z.string()).default([]),
  suitableCrowd: z.array(z.string()).default([]),
  cultureStory: z.string().nullable().default(null),
  bestTimeToEat: z.string().nullable().default(null),
  sourceId: z.string(),
  freshnessDate: z.string(),
  reviewStatus: reviewStatusSchema,
});

export const promptConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  systemPrompt: z.string(),
  isPublished: z.boolean(),
});

export type SourceRecord = z.infer<typeof sourceRecordSchema>;
export type Poi = z.infer<typeof poiSchema>;
export type FoodVenue = z.infer<typeof foodVenueSchema>;
export type Dish = z.infer<typeof dishSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type ThemeDetail = z.infer<typeof themeDetailSchema>;
export type PlanIntent = z.infer<typeof planIntentSchema>;
export type GeneratePlanRequest = z.infer<typeof generatePlanRequestSchema>;
export type RefinePlanRequest = z.infer<typeof refinePlanRequestSchema>;
export type PlanResult = z.infer<typeof planResultSchema>;
export type PlanSession = z.infer<typeof planSessionSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type DirectoryFoodItem = z.infer<typeof directoryFoodItemSchema>;
export type AdminUpsertPoiInput = z.infer<typeof adminUpsertPoiSchema>;
export type AdminUpsertFoodVenueInput = z.infer<typeof adminUpsertFoodVenueSchema>;
export type PromptConfig = z.infer<typeof promptConfigSchema>;
