import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

const CREDENTIALS_MSG =
  "PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD must be set (e.g. in .env.local). " +
  "Add them and ensure playwright.config.ts loads .env.local. E2E tests require auth and will not skip.";

/**
 * Log in with credentials from env and save storage state so other tests run authenticated.
 * If unset, this step fails so the run reports the issue instead of skipping tests.
 */
setup("authenticate", async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(CREDENTIALS_MSG);
  }

  await page.goto("/login?redirect=" + encodeURIComponent("/reports/employees"), {
    waitUntil: "networkidle",
  });

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 });
  await page.waitForURL((url) => {
    const path = new URL(url).pathname;
    return path === "/" || path.startsWith("/reports/") || path.startsWith("/onboarding");
  }, { timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
