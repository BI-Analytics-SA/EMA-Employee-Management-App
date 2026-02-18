import { test, expect } from "@playwright/test";

/**
 * E2E tests for Employee Report (EMA-3).
 * When not authenticated, the app may redirect to login; we assert the app responds.
 */
test.describe("Employee Report page", () => {
  test("navigating to /reports/employees loads a page with Employee Report or login", async ({
    page,
  }) => {
    await page.goto("/reports/employees", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/(reports\/employees|login|onboarding)/);
    await expect(
      page.getByText(/Employee Report|Sign in|Sign In|Welcome|Onboarding|Empl Management/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("when on report page, Columns button is present", async ({ page }) => {
    await page.goto("/reports/employees");
    const reportHeading = page.getByRole("heading", { name: /employee report/i });
    await expect(
      reportHeading,
      "Expected to be on Employee Report page (authenticated). Check PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD in .env.local."
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByTitle("Choose columns")).toBeVisible();
  });

  test("when on report page, Edit link for first row goes to edit URL", async ({ page }) => {
    await page.goto("/reports/employees");
    await expect(
      page.getByRole("heading", { name: /employee report/i }),
      "Expected Employee Report page. Ensure credentials are set and test user has employees."
    ).toBeVisible({ timeout: 15000 });
    const table = page.getByRole("table");
    const firstEditLink = table.getByRole("link", { name: /edit/i }).first();
    await expect(firstEditLink, "Expected at least one Edit link (need employee data).").toBeVisible();
    await expect(firstEditLink).toHaveAttribute("href", /\/employees\/[^/]+\/edit/);
  });

  test("when on report page, Edit link includes returnTo so Save returns to report", async ({
    page,
  }) => {
    await page.goto("/reports/employees");
    await expect(
      page.getByRole("heading", { name: /employee report/i }),
      "Expected Employee Report page. Ensure credentials are set and test user has employees."
    ).toBeVisible({ timeout: 15000 });
    const firstEditLink = page.getByRole("table").getByRole("link", { name: /edit/i }).first();
    await expect(firstEditLink, "Expected at least one Edit link (need employee data).").toBeVisible();
    await expect(firstEditLink).toHaveAttribute("href", /returnTo=%2Freports%2Femployees/);
  });

  test("after Save on Edit page opened from report, user returns to report page", async ({
    page,
  }) => {
    await page.goto("/reports/employees");
    await expect(
      page.getByRole("heading", { name: /employee report/i }),
      "Expected Employee Report page. Ensure credentials are set and test user has employees."
    ).toBeVisible({ timeout: 15000 });
    const firstEditLink = page.getByRole("table").getByRole("link", { name: /edit/i }).first();
    await expect(firstEditLink, "Expected at least one Edit link (need employee data).").toBeVisible();
    await firstEditLink.click();
    await expect(page).toHaveURL(/\/employees\/[^/]+\/edit/);
    await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(
      page,
      "After Save, expected to return to /reports/employees. Check returnTo and Edit page redirect."
    ).toHaveURL(/\/reports\/employees/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /employee report/i })).toBeVisible();
  });
});
