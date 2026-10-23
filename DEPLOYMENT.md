# Deployment Guide: Convex Dev/Prod + Netlify

This app uses **two Convex deployments** (dev and production) and **Netlify branch deploys** (dev and main).

Convex Deploy Methods at the bottom

## Convex deployments


| Environment | Deployment             | URL                                                                                        |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| Dev         | resilient-lemming-288  | [https://resilient-lemming-288.convex.cloud](https://resilient-lemming-288.convex.cloud)   |
| Production  | energized-squirrel-967 | [https://energized-squirrel-967.convex.cloud](https://energized-squirrel-967.convex.cloud) |


---

## Netlify setup

### 1. Environment variables

In **Netlify Dashboard** → site `bia-pepl` → **Site settings** → **Environment variables**.

**Rule: only Production uses the prod Convex database.** Every other context (Deploy Previews, Branch deploys, Preview Server & Agent Runners, Local development) uses **dev**, so agents and testers working on previews never touch live data.

| Variable               | Production                                    | All other contexts                           |
| ---------------------- | --------------------------------------------- | -------------------------------------------- |
| `VITE_CONVEX_URL`      | `https://energized-squirrel-967.convex.cloud` | `https://resilient-lemming-288.convex.cloud` |
| `VITE_CONVEX_SITE_URL` | `https://energized-squirrel-967.convex.site`  | `https://resilient-lemming-288.convex.site`  |

Notes:

- `VITE_CONVEX_URL` is what the frontend connects to (`src/App.tsx`). Vite inlines it **at build time**, so changing it only affects new builds — redeploy (or delete) any existing previews.
- `VITE_CONVEX_SITE_URL` is not currently read by the frontend; keep it in sync anyway.
- Do **not** set `CONVEX_DEPLOYMENT` in Netlify. The Netlify build doesn't run the Convex CLI; that variable belongs in `.env.local` only.
- Deploy previews share the single dev Convex deployment. It only has the functions/schema last pushed by `npx convex dev`, so push a branch's backend changes to dev before testing its preview — see [Updating Convex dev](#updating-convex-dev-before-testing-previews-and-merging-into-dev).
- Dev Convex has `SITE_URL=http://localhost:5173`, so invite emails sent from previews link to localhost.


### 2. Branch deploys

1. Go to **Site settings** → **Build & deploy** → **Branches and deploy contexts**.
2. Set **Production branch** to `main`.
3. Under **Branch deploys**, choose “Let me add individual branches” and add `dev`.

---

## Updating Convex dev (before testing previews and merging into dev)

Netlify only builds the **frontend**. The Convex backend (everything in `convex/`) is **not** deployed by Netlify or GitHub — the dev Convex deployment (`resilient-lemming-288`) only changes when someone runs `npx convex dev` from their machine. Every deploy preview, the `dev` branch deploy, and local dev all share that one dev backend.

If a PR changes anything in `convex/` and dev Convex hasn't been updated, the preview's frontend will call functions or fields that don't exist yet and fail (errors like `Could not find public function ...` or schema validation errors).

### Does the PR need a Convex push?

```bash
git fetch origin
git diff --stat origin/dev...HEAD -- convex/
```

No output → frontend-only change, skip the Convex steps below.

### Step 1 — Before testing a PR's deploy preview

From the PR branch, push its backend to dev Convex once:

```bash
git checkout <pr-branch>
git pull
npx convex dev --once
```

`--once` typechecks and pushes the functions and schema, then exits. (Plain `npx convex dev` does the same and keeps watching for changes.) Once it succeeds, open or refresh the PR's deploy preview and test.

### Step 2 — Before merging the PR into `dev`

Make sure dev Convex still has **this** PR's backend — another branch may have been pushed since Step 1. If in doubt, rerun `npx convex dev --once` from the PR branch. Only merge once the preview works against dev Convex.

### Step 3 — After merging into `dev`

Sync dev Convex to the merged `dev` branch so the `dev` branch deploy (`dev--bia-pepl.netlify.app`) and local dev match:

```bash
git checkout dev
git pull
npx convex dev --once
```

### Rules for the shared dev backend

- **Last push wins.** Only one branch's backend can be on dev Convex at a time. When agents or testers work on several PRs with backend changes, test them one at a time, or confirm the branches don't conflict in `convex/`.
- **Schema changes must fit existing dev data.** Convex rejects a push if existing documents don't match the new schema (e.g. a new required field, or a removed field that still has data). Add new fields as `v.optional(...)` first, or migrate/clean the dev data, then push.
- **Removing functions or fields:** the `dev` branch deploy may still call them until the PR is merged. Remove them only after the frontend that uses them is gone (same rule as production below).
- **Never** run `npx convex deploy` for this — that targets **production**. Dev is updated with `npx convex dev`.

---

## Checking which build is live

Every Netlify build records the commit it was built from (Netlify's `COMMIT_REF`, plus `BRANCH`, `CONTEXT`, `DEPLOY_ID`, and the PR number for deploy previews). This is set up in `vite.config.ts` and shows up in two places:

- **In the app:** user menu → `App version 1.7.0 · 19b784b`. Non-production builds also show the branch (e.g. `· dev`). Hover for the full commit, branch, context, and build time.
- **`/version.json`:** a machine-readable file served with `no-cache`, for QA bots and scripts:

  ```json
  {
    "version": "1.7.0",
    "commit": "19b784b76139e97ffb2ec3f2f1d32089e7f1e54c",
    "branch": "dev",
    "context": "branch-deploy",
    "pullRequest": null,
    "deployId": "…",
    "builtAt": "2026-10-22T09:57:12.818Z"
  }
  ```

`version` comes from `package.json` and only changes on release (main), so use **`commit`** to prove what is deployed.

| Environment | URL | `commit` should equal |
| ----------- | --- | --------------------- |
| Dev branch deploy | `https://dev--bia-pepl.netlify.app/version.json` | `git rev-parse origin/dev` |
| Deploy preview | `https://deploy-preview-<PR>--bia-pepl.netlify.app/version.json` | the PR's head commit |
| Production | `https://pepl.co.za/version.json` | `git rev-parse origin/main` — the `chore(release): x.y.z` commit, i.e. `git rev-list -n 1 vX.Y.Z` |

Example check after merging into dev:

```bash
git fetch origin
curl -s https://dev--bia-pepl.netlify.app/version.json | grep commit
git rev-parse origin/dev
```

If they differ, the Netlify build for the merge hasn't finished (or failed) — check the Deploys page in Netlify. For production, the release workflow triggers the build after semantic-release pushes the version-bump commit, so `version` and `commit` both update together.

`/version.json` covers the **frontend** only. It does not prove which branch's backend is on the shared dev Convex deployment — follow [Updating Convex dev](#updating-convex-dev-before-testing-previews-and-merging-into-dev) for that.

---

## Dev branch (one-time)

If the `dev` branch does not exist on GitHub yet, create and push it from your machine:

```bash
git checkout -b dev   # if not already on dev
git push -u origin dev
```

Then in Netlify, enable branch deploys for `dev` (see step 2 above).

---

## Local development

Keep `.env.local` pointing at **dev** (do not commit this file):

```env
CONVEX_DEPLOYMENT=dev:resilient-lemming-288
VITE_CONVEX_URL=https://resilient-lemming-288.convex.cloud
VITE_CONVEX_SITE_URL=https://resilient-lemming-288.convex.site
```

---

## Versioning (semantic-release)

Version bumps are **automated** via [semantic-release](https://github.com/semantic-release/semantic-release) on push to `main`. The bump type is determined entirely by your commit messages using [Conventional Commits](https://www.conventionalcommits.org/) syntax.

### Commit message → version bump

| Commit message | Bump | Example version change |
|---|---|---|
| `fix: resolve date overlap` | **PATCH** | 1.0.0 → 1.0.1 |
| `fix(contracts): handle null dates` | **PATCH** | 1.0.0 → 1.0.1 |
| `feat: add employee import` | **MINOR** | 1.0.1 → 1.1.0 |
| `feat(reports): custom column picker` | **MINOR** | 1.0.1 → 1.1.0 |
| `feat!: require org slug on signup` | **MAJOR** | 1.1.0 → 2.0.0 |
| `fix!: rename auth endpoints` | **MAJOR** | 1.1.0 → 2.0.0 |
| With `BREAKING CHANGE:` in body | **MAJOR** | 1.1.0 → 2.0.0 |

### Breaking change syntax (major bump)

There are two ways to signal a breaking change:

1. **Bang (`!`) after the type** — append `!` before the colon:
   ```
   feat!: require org slug on signup
   ```

2. **`BREAKING CHANGE:` footer** in the commit body:
   ```
   feat: require org slug on signup

   BREAKING CHANGE: the signup endpoint now requires an org slug parameter
   ```

### Non-release prefixes

These prefixes are valid but do **not** trigger a version bump:

`chore:`, `docs:`, `refactor:`, `style:`, `test:`, `ci:`, `build:`, `perf:`

### Rules

- Prefixes **must be lowercase**: `fix:` not `Fix:`, `feat:` not `Feat:`
- A **colon is required** after the type: `feat: add X` not `feat add X`
- Use present tense, lowercase after the colon: `fix: resolve overlap`

### Release tracking

- **Shipped (prod):** every release creates a [GitHub Release](https://github.com/BI-Analytics-SA/EMA-Employee-Management-App/releases) with notes generated from the commits, and comments "released in vX" on each shipped PR.
- **Waiting to ship (on dev, not in prod):** keep one PR open from `dev` → `main` titled **"Release: next"**. Its Commits and Files tabs always show what's on dev but not in prod. Merging it is the production release; open a fresh one afterwards. From the CLI:
  ```bash
  git fetch origin && git log --oneline --no-merges origin/main..origin/dev
  ```
- **Jira (PEPL):** put the PEPL key in the branch name, PR title, and a `Refs:` commit footer (see [Jira keys](#jira-keys)). The GitHub for Jira app then shows each issue's commits and PRs, and the release workflow's `production` environment shows when they reached prod.

### Jira keys

Use uppercase PEPL keys so GitHub for Jira can match them:

| Where | Example |
|---|---|
| Branch | `feat/PEPL-123-build-info` |
| PR title | `feat: show build commit in header (PEPL-123)` |
| Commit footer | `Refs: PEPL-123` |

Keep the Conventional Commit prefix first — the key goes in the branch, the PR title suffix, or the footer, never in place of `feat:` / `fix:`.

---

## Deploying Convex to production (manual)

Convex production is **not** deployed on git push. Deploy when you’re ready:

1. **Preview changes**
  ```bash
   npx convex deploy --dry-run
  ```
2. **Deploy**
  ```bash
   npx convex deploy -y
  ```

Deploy **before** merging to main when you add new functions or schema; deploy **after** when removing functions.