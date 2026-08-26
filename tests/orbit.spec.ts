import { test, expect } from "@playwright/test";

test.describe("ORBIT critical demo flows", () => {
  test("landing page explains verified allocation boundary", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ORBIT" })).toBeVisible();
    await expect(page.getByText("Estimated gas and measured gas are never blended")).toBeVisible();
  });

  test("login form has generic secure error surface", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Secure login" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("safe trace page does not expose private operator data", async ({ page }) => {
    await page.goto("/trace/demo");
    await expect(page.getByText("Safe ORBIT Trace")).toBeVisible();
    await expect(page.getByText("private user, facility, and internal database")).toBeVisible();
  });
});
