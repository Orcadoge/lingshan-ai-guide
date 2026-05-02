import { describe, expect, it } from "vitest";

import { planIntentSchema } from "../src";

describe("planIntentSchema", () => {
  it("accepts a valid planner intent", () => {
    const result = planIntentSchema.safeParse({
      originalQuery: "两天一夜历史文化路线",
      durationDays: 2,
      transportMode: "public",
      companions: ["friends"],
      budgetLevel: "medium",
      budgetAmount: 600,
      interests: ["history", "food"],
      foodPreferences: ["local-specialty"],
      pace: "standard",
      constraints: ["少走路"],
      mustVisitSlugs: ["congtai-park"],
    });

    expect(result.success).toBe(true);
  });
});
