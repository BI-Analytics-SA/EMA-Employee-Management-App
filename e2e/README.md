# E2E tests (Playwright)

Run with: `npm run test:e2e`

## Credentials (required)

E2E tests require a logged-in user and do **not** skip: if something is wrong, the run **fails** with a clear message.

1. **Add credentials** in `.env.local` (loaded automatically by Playwright; file is gitignored, data stays local):
   - `PLAYWRIGHT_TEST_EMAIL` – email of a test user
   - `PLAYWRIGHT_TEST_PASSWORD` – that user’s password

2. Ensure the app and Convex are running (e.g. `npm run dev` and `npx convex dev`).

3. Run: `npm run test:e2e`

The first run logs in and saves session state to `e2e/.auth/user.json` (gitignored). Later tests reuse it. If the env vars are not set, the auth setup **fails** and reports that credentials are required.
