import {
  getApprovedDishes,
  getApprovedFoodVenues,
  getApprovedPois,
  getPlanSessionById,
  createPlanSession,
  getThemes,
} from '@handan/data';
import { generatePlan } from '@handan/planner';
import type {
  Dish,
  FoodVenue,
  GeneratePlanRequest,
  PlanIntent,
  Poi,
  RefinePlanRequest,
  Theme,
} from '@handan/shared';
import { Injectable } from '@nestjs/common';

import { maybeGenerateAiSuggestions } from './planner-llm';

export type PlanGenerateProgress = {
  stage: 'loading-data' | 'rule-draft' | 'ai-polish' | 'saving';
  message: string;
  preview?: {
    tripTitle: string;
    summary: string;
    days: Array<{
      dayIndex: number;
      theme: string;
      stops: string[];
    }>;
  };
};

type GenerateOptions = {
  onProgress?: (event: PlanGenerateProgress) => void;
};

function applyRefinement(intent: PlanIntent, instruction: string): PlanIntent {
  const nextIntent: PlanIntent = {
    ...intent,
    companions: [...intent.companions],
    interests: [...intent.interests],
    foodPreferences: [...intent.foodPreferences],
    constraints: [...intent.constraints],
    mustVisitSlugs: [...intent.mustVisitSlugs],
  };

  const budgetMatch = instruction.match(/(\d{3,4})\s*元/);
  if (budgetMatch) {
    nextIntent.budgetAmount = Number(budgetMatch[1]);
    nextIntent.budgetLevel = 'custom';
  }

  if (/减少步行|少走路/.test(instruction)) {
    nextIntent.pace = 'relaxed';
    nextIntent.constraints = Array.from(
      new Set([...nextIntent.constraints, '少走路']),
    );
    if (nextIntent.transportMode === 'walk-first') {
      nextIntent.transportMode = 'taxi';
    }
  }

  if (/美食/.test(instruction)) {
    nextIntent.interests = Array.from(
      new Set([...nextIntent.interests, 'food']),
    );
  }

  if (/文化/.test(instruction)) {
    nextIntent.interests = Array.from(
      new Set([...nextIntent.interests, 'history']),
    );
  }

  if (/雨/.test(instruction)) {
    nextIntent.constraints = Array.from(
      new Set([...nextIntent.constraints, '雨天']),
    );
  }

  if (/亲子/.test(instruction)) {
    nextIntent.companions = Array.from(
      new Set([...nextIntent.companions, 'family']),
    );
    nextIntent.pace = 'relaxed';
  }

  if (/夜游/.test(instruction)) {
    nextIntent.interests = Array.from(
      new Set([...nextIntent.interests, 'citywalk', 'food']),
    );
    nextIntent.constraints = Array.from(
      new Set([...nextIntent.constraints, '晚上出发']),
    );
  }

  return nextIntent;
}

@Injectable()
export class PlansService {
  async generate(body: GeneratePlanRequest, options: GenerateOptions = {}) {
    options.onProgress?.({
      stage: 'loading-data',
      message: '正在读取邯郸景点、美食和主题资料...',
    });

    const [pois, foodVenues, dishes, themes] = await Promise.all([
      getApprovedPois(),
      getApprovedFoodVenues(),
      getApprovedDishes(),
      getThemes(),
    ]);

    const basePlan = generatePlan({
      intent: body.intent,
      pois: pois as unknown as Poi[],
      foodVenues: foodVenues as unknown as FoodVenue[],
      dishes: dishes as unknown as Dish[],
      themes: themes as unknown as Theme[],
    });

    options.onProgress?.({
      stage: 'rule-draft',
      message: '先排出了一版顺路草稿，正在继续优化讲解和节奏。',
      preview: {
        tripTitle: basePlan.tripTitle,
        summary: basePlan.summary,
        days: basePlan.days.map((day) => ({
          dayIndex: day.dayIndex,
          theme: day.theme,
          stops: day.segments
            .filter(
              (segment) =>
                segment.entityType === 'poi' ||
                segment.entityType === 'foodVenue',
            )
            .slice(0, 4)
            .map((segment) => segment.title),
        })),
      },
    });

    options.onProgress?.({
      stage: 'ai-polish',
      message: 'AI 导游正在补充更自然的路线理由和提醒...',
    });

    const { suggestions, meta } = await maybeGenerateAiSuggestions({
      intent: body.intent,
      pois: pois as unknown as Poi[],
      foodVenues: foodVenues as unknown as FoodVenue[],
      dishes: dishes as unknown as Dish[],
      themes: themes as unknown as Theme[],
      basePlan,
    });

    const sessionId = crypto.randomUUID();
    const shareId = crypto.randomUUID().slice(0, 8);

    options.onProgress?.({
      stage: 'saving',
      message: '路线已经生成，正在保存分享链接。',
    });

    const result = {
      sessionId,
      shareId,
      ...generatePlan({
        intent: body.intent,
        pois: pois as unknown as Poi[],
        foodVenues: foodVenues as unknown as FoodVenue[],
        dishes: dishes as unknown as Dish[],
        themes: themes as unknown as Theme[],
        aiSuggestions: suggestions ?? undefined,
      }),
    };

    await createPlanSession({
      id: sessionId,
      shareId,
      intent: body.intent,
      result,
      modelMeta: meta,
    });

    return result;
  }

  async refine(body: RefinePlanRequest) {
    const session = await getPlanSessionById(body.sessionId);
    const previousIntent = session.parsedIntent as unknown as PlanIntent;

    return this.generate({
      intent: applyRefinement(previousIntent, body.instruction),
    });
  }
}
