import { test, expect } from "@playwright/test";

test.describe("ORBIT Operational Workflow E2E", () => {
  test("1. Canteen Staff registers waste and marks ready", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("canteen@orbit.test");
    await page.getByLabel("Password").fill("OrbitDemo2026!");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/canteen\/dashboard/);

    // Verify canteen dashboard title & clean operational UX
    await expect(page.getByRole("heading", { name: "Canteen Waste Station" })).toBeVisible();
    await expect(page.getByText("Select your assigned reusable container")).toBeVisible();

    // Check register action button on dashboard
    await expect(page.getByRole("link", { name: "Register Waste" }).first()).toBeVisible();

    // Go to register batch
    await page.goto("/batches/new");
    await expect(page.getByRole("heading", { name: "Register Organic Waste" })).toBeVisible();
    await expect(page.getByText("No Scale or Weighing Required at School")).toBeVisible();
    await expect(page.getByLabel("Assigned Reusable Container *")).toBeVisible();
  });

  test("2. School Admin requests pickup for ready batches", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("school@orbit.test");
    await page.getByLabel("Password").fill("OrbitDemo2026!");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/school\/dashboard/);

    // Verify school admin header
    await expect(page.getByRole("heading", { name: "School Waste Collection Center" })).toBeVisible();

    // Go to pickup operations
    await page.goto("/operations/pickups");
    await expect(page.getByRole("heading", { name: "Organic Waste Pickup Operations" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create School Pickup Request" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Select all", exact: true })).toBeVisible();
  });

  test("3. Operator roadside inbox shows logistics only", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("operator@orbit.test");
    await page.getByLabel("Password").fill("OrbitDemo2026!");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/operator\/dashboard/);

    // Verify operator logistics dashboard
    await expect(page.getByRole("heading", { name: "Logistics & Route Control Panel" })).toBeVisible();
    
    // Go to operator pickups dispatch page
    await page.goto("/operations/pickups");
    await expect(page.getByRole("heading", { name: "Organic Waste Pickup Operations" })).toBeVisible();

    // Check filter tabs
    await expect(page.getByRole("button", { name: /Incoming Requests/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Scheduled \/ Dispatch/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /In Transit/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Completed/ })).toBeVisible();

    // Strict boundary: Operator must not have conversion or inspection in sidebar
    await expect(page.getByRole("link", { name: "Conversion Cycles" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Inspections" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Allocations" })).toHaveCount(0);
  });

  test("4. Community Facility owns facility reception, inspection, conversion & allocation", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("community@orbit.test");
    await page.getByLabel("Password").fill("OrbitDemo2026!");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/community\/dashboard/);

    // Verify Community Facility operations center
    await expect(page.getByRole("heading", { name: /Community Processing Center/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Receive Container" }).first()).toBeVisible();

    // Check inspection live math calculation form
    await page.goto("/operations/inspections");
    await expect(page.getByRole("heading", { name: "Community Facility Inspection" })).toBeVisible();
    await expect(page.getByText("ORBIT Automated Calculation")).toBeVisible();
    await expect(page.getByText("Accepted Organics", { exact: true })).toBeVisible();

    // Check conversion page
    await page.goto("/operations/conversions");
    await expect(page.getByRole("heading", { name: "Biodigester Conversion Cycles" })).toBeVisible();

    // Check allocation page & 30% Community Facility pool label
    await page.goto("/operations/allocations");
    await expect(page.getByRole("heading", { name: "Energy Allocation" })).toBeVisible();
    await expect(page.getByText("Community Facility / O&M Pool").first()).toBeVisible();

    // Check fulfilment page
    await page.goto("/operations/fulfilment");
    await expect(page.getByRole("heading", { name: "Energy Allocation & Fulfilment" })).toBeVisible();
  });

  test("5. Student educational journey, science hub and school profile", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("student@orbit.test");
    await page.getByLabel("Password").fill("OrbitDemo2026!");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Verify student overview
    await expect(page.getByRole("heading", { name: "Circular Bioenergy Learning Journey" })).toBeVisible();

    // Visit interactive journey
    await page.goto("/student/journey");
    await expect(page.getByRole("heading", { name: "Interactive Circular Journey" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Canteen Sorting at Source" })).toBeVisible();

    // Visit science hub
    await page.goto("/student/learn");
    await expect(page.getByRole("heading", { name: "Bioenergy Science & Feedstock Learning" })).toBeVisible();
    await expect(page.getByText("The Four Stages of Anaerobic Digestion")).toBeVisible();

    // Visit school profile
    await page.goto("/student/school");
    await expect(page.getByText("Verified Accepted Organics")).toBeVisible();
    await expect(page.getByText("Average Purity Level")).toBeVisible();
  });
});
