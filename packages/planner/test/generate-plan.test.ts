import { describe, expect, it } from "vitest";

import { generatePlan } from "../src";
import { dishes, foodVenues, pois, themes } from "../../data/src/seed-data";

describe("generatePlan", () => {
  it("returns a structured executable plan", () => {
    const result = generatePlan({
      intent: {
        originalQuery: "两天一夜邯郸历史景点和本地美食路线",
        durationDays: 2,
        transportMode: "public",
        companions: ["friends"],
        budgetLevel: "medium",
        budgetAmount: 600,
        interests: ["history", "food"],
        foodPreferences: ["local-specialty"],
        pace: "standard",
        constraints: [],
        mustVisitSlugs: ["congtai-park"],
      },
      pois: pois.map((item) => ({
        ...item,
        freshnessDate: "2026-04-01",
        reviewStatus: "APPROVED" as const,
      })),
      foodVenues: foodVenues.map((item) => ({
        ...item,
        freshnessDate: "2026-04-01",
        reviewStatus: "APPROVED" as const,
      })),
      dishes: dishes.map((item) => ({
        ...item,
        freshnessDate: "2026-04-01",
        reviewStatus: "APPROVED" as const,
      })),
      themes: themes.map((item) => item),
    });

    expect(result.days.length).toBeGreaterThan(0);
    expect(result.tripTitle).toContain("邯郸");
    expect(result.days[0].segments.length).toBeGreaterThan(0);
  });
});
