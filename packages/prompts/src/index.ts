import type { PlanIntent, Poi, FoodVenue, Dish } from "@handan/shared";

export type PromptBundle = {
  system: string;
  user: string;
};

export function buildPlannerPrompt(input: {
  intent: PlanIntent;
  pois: Poi[];
  foodVenues: FoodVenue[];
  dishes: Dish[];
}): PromptBundle {
  return {
    system:
      "你是邯郸本地文旅规划助手。只能从候选实体中选择，不得编造景点、美食、营业时间、门票或位置。请优先保证路线可执行，再补充精炼中文解释。",
    user: JSON.stringify(
      {
        intent: input.intent,
        candidatePois: input.pois.map((poi) => ({
          id: poi.id,
          name: poi.name,
          tags: poi.tags,
          stayMinutes: poi.recommendStayMinutes,
        })),
        candidateFoodVenues: input.foodVenues.map((venue) => ({
          id: venue.id,
          name: venue.name,
          avgPrice: venue.avgPrice,
          bestTimeToEat: venue.bestTimeToEat,
        })),
        candidateDishes: input.dishes.map((dish) => ({
          id: dish.id,
          name: dish.name,
          tags: dish.tags,
        })),
      },
      null,
      2,
    ),
  };
}

export const DEFAULT_PROMPT_CONFIGS = [
  {
    id: "intent-parser",
    name: "Intent Parser Prompt",
    version: "v1",
    description: "将自然语言和表单输入统一为用户意图结构。",
    systemPrompt:
      "解析用户的出行需求，只能输出结构化字段，若信息缺失请在 warnings 中指出。",
    isPublished: true,
  },
  {
    id: "planner",
    name: "Planner Prompt",
    version: "v1",
    description: "对规则引擎结果做自然语言解释增强。",
    systemPrompt:
      "在不改变规则结果和实体集合的前提下，补充路线摘要、亮点与替代建议。",
    isPublished: true,
  },
  {
    id: "refine",
    name: "Refine Prompt",
    version: "v1",
    description: "处理预算压缩、减少步行和雨天等二次编辑。",
    systemPrompt:
      "根据用户新的自然语言约束，对已有结构化路线执行局部重规划，保持 JSON 结构稳定。",
    isPublished: true,
  },
] as const;
