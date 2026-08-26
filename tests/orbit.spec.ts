import { test, expect } from "@playwright/test";

const publicRoutes = ["/", "/transparency", "/impact", "/methodology", "/partners", "/about", "/sources", "/trace/demo"];

test.describe("ORBIT public evidence platform", () => {
  for (const route of publicRoutes) {
    test(`public route ${route} is accessible`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByText("ORBIT").first()).toBeVisible();
    });
  }

  test("landing navigation and anchors work", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Turning cleaner school waste/ })).toBeVisible();
    await page.getByRole("link", { name: "See How It Works" }).click();
    await expect(page.locator("#how-it-works")).toBeInViewport();
  });

  test("public metrics show confidence labels", async ({ page }) => {
    await page.goto("/transparency");
    await expect(page.getByText("Simulated Demo").first()).toBeVisible();
    await expect(page.getByText("Measured").first()).toBeVisible();
  });

  test("missing public trace shows useful error", async ({ page }) => {
    await page.goto("/trace/not-a-real-token");
    await expect(page.getByRole("heading", { name: "Trace not found" })).toBeVisible();
  });

  test("mobile navigation opens", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile public navigation" })).toBeVisible();
  });
});

test.describe("ORBIT private workspace", () => {
  test("authenticated routes are protected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("operator can log in and see role-specific dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("operator@orbit.test");
    await page.getByLabel("Password").fill("OrbitDemo2026!");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Operator Dashboard" })).toBeVisible();
    await expect(page.getByText("Incoming feedstock and inspections")).toBeVisible();
  });
});
