import type { PlannerAiSuggestions } from '@handan/planner';
import { buildPlannerPrompt } from '@handan/prompts';
import { alternativeTypeSchema } from '@handan/shared';
import type {
  Dish,
  FoodVenue,
  PlanIntent,
  PlanResult,
  Poi,
  Theme,
} from '@handan/shared';
import { z } from 'zod';

import {
  callArkChatCompletion,
  getArkChatConfig,
} from '../../common/ark-client';

const aiSuggestionSchema = z.object({
  poiPriorityIds: z.array(z.string()).default([]),
  foodVenuePriorityIds: z.array(z.string()).default([]),
  tripTitle: z.string().min(4).optional(),
  summary: z.string().min(8).optional(),
  whyThisPlan: z.string().min(8).optional(),
  dayThemes: z.array(z.string()).default([]),
  alternatives: z
    .array(
      z.object({
        type: alternativeTypeSchema,
        description: z.string().min(4),
      }),
    )
    .default([]),
  warnings: z.array(z.string()).default([]),
  segmentReasons: z.record(z.string(), z.string()).default({}),
});

type LlmPlannerInput = {
  intent: PlanIntent;
  pois: Poi[];
  foodVenues: FoodVenue[];
  dishes: Dish[];
  themes: Theme[];
  basePlan: Omit<PlanResult, 'sessionId' | 'shareId'>;
};

type LlmPlannerResult = {
  suggestions: PlannerAiSuggestions | null;
  meta: Record<string, unknown>;
};

function isLlmEnabled() {
  return /^(1|true|yes)$/i.test(process.env.PLANNER_USE_LLM ?? '');
}

function dedupeIds(ids: string[], allowedIds: Set<string>) {
  return Array.from(new Set(ids.filter((id) => allowedIds.has(id))));
}

function stripJsonEnvelope(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  return raw.trim();
}

function buildPrompt(input: LlmPlannerInput) {
  const bundle = buildPlannerPrompt({
    intent: input.intent,
    pois: input.pois,
    foodVenues: input.foodVenues,
    dishes: input.dishes,
  });

  return {
    system: `${bundle.system}
你要做的是“混合规划增强”，不是凭空新建路线。
请严格遵守：
1. 只能从给定候选 POI 和餐饮实体中选择，不能编造新地点。
2. 输出必须是 JSON，不要附带解释文字。
3. poiPriorityIds 和 foodVenuePriorityIds 用于表达优先顺序，越靠前优先级越高。
4. dayThemes 长度尽量与天数一致。
5. segmentReasons 的 key 只能使用候选实体 id，对应值写成自然、面向游客的中文理由。
6. alternatives.type 只能使用 rainy_day、less_walking、budget。
7. 文案要像面向游客的行程建议，不要出现“规则引擎”“JSON”“候选集”等开发者用语。
8. tripTitle、summary、whyThisPlan 要有旅行编辑或在地向导的口吻，避免“围绕……展开”“兼顾……控制”这类模板句。`,
    user: JSON.stringify(
      {
        instruction:
          '请结合用户意图、候选点位和当前规则规划结果，给出更像真人导游会写的路线优先级建议与叙事增强。',
        candidates: JSON.parse(bundle.user),
        themes: input.themes.map((theme) => ({
          slug: theme.slug,
          name: theme.name,
          intro: theme.intro,
        })),
        basePlan: input.basePlan,
        responseShape: {
          poiPriorityIds: ['poi-id-1', 'poi-id-2'],
          foodVenuePriorityIds: ['food-id-1'],
          tripTitle: 'string',
          summary: 'string',
          whyThisPlan: 'string',
          dayThemes: ['string'],
          alternatives: [{ type: 'rainy_day', description: 'string' }],
          warnings: ['string'],
          segmentReasons: {
            'poi-id-1': 'string',
            'food-id-1': 'string',
          },
        },
      },
      null,
      2,
    ),
  };
}

export async function maybeGenerateAiSuggestions(
  input: LlmPlannerInput,
): Promise<LlmPlannerResult> {
  const generatedAt = new Date().toISOString();

  if (!isLlmEnabled()) {
    return {
      suggestions: null,
      meta: {
        provider: 'rules-only',
        plannerMode: 'rules-only',
        generatedAt,
      },
    };
  }

  const arkConfig = getArkChatConfig();

  if (!arkConfig.apiKey || !arkConfig.model) {
    return {
      suggestions: null,
      meta: {
        provider: 'rules-only',
        plannerMode: 'rules-fallback',
        generatedAt,
        fallbackReason: 'missing_api_key_or_model',
      },
    };
  }

  const prompt = buildPrompt(input);

  try {
    const content = await callArkChatCompletion({
      config: arkConfig,
      temperature: 0.5,
      responseFormat: {
        type: 'json_object',
      },
      messages: [
        {
          role: 'system',
          content: prompt.system,
        },
        {
          role: 'user',
          content: prompt.user,
        },
      ],
    });
    const parsed = aiSuggestionSchema.parse(
      JSON.parse(stripJsonEnvelope(content)),
    );

    const allowedPoiIds = new Set(input.pois.map((poi) => poi.id));
    const allowedFoodVenueIds = new Set(
      input.foodVenues.map((venue) => venue.id),
    );
    const allowedSegmentIds = new Set([
      ...allowedPoiIds,
      ...allowedFoodVenueIds,
    ]);

    return {
      suggestions: {
        poiPriorityIds: dedupeIds(parsed.poiPriorityIds, allowedPoiIds),
        foodVenuePriorityIds: dedupeIds(
          parsed.foodVenuePriorityIds,
          allowedFoodVenueIds,
        ),
        narrative: {
          tripTitle: parsed.tripTitle,
          summary: parsed.summary,
          whyThisPlan: parsed.whyThisPlan,
          dayThemes: parsed.dayThemes,
          alternatives: parsed.alternatives,
          warnings: parsed.warnings,
          segmentReasons: Object.fromEntries(
            Object.entries(parsed.segmentReasons).filter(([id]) =>
              allowedSegmentIds.has(id),
            ),
          ),
        },
      },
      meta: {
        provider: 'volcengine-ark',
        plannerMode: 'hybrid-ai',
        generatedAt,
        model: arkConfig.model,
      },
    };
  } catch (error) {
    return {
      suggestions: null,
      meta: {
        provider: 'rules-only',
        plannerMode: 'rules-fallback',
        generatedAt,
        model: arkConfig.model,
        fallbackReason:
          error instanceof Error ? error.message : 'unknown_llm_error',
      },
    };
  }
}
