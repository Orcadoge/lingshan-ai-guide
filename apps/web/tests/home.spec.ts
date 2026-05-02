import { test, expect } from "@playwright/test";

test("home page renders planner headline", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "一句话，把邯郸的景点、美食和节奏排成能出发的路线。",
    }),
  ).toBeVisible();
});
