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

In **Netlify Dashboard** → your site → **Site settings** → **Environment variables**:

#### Production (main branch)

Add these for **Production** context (or scope to branch `main`):


| Variable               | Value                                         |
| ---------------------- | --------------------------------------------- |
| `VITE_CONVEX_URL`      | `https://energized-squirrel-967.convex.cloud` |
| `VITE_CONVEX_SITE_URL` | `https://energized-squirrel-967.convex.site`  |


#### Branch deploys (dev branch)

Add the same variable names for **Branch deploys** (or scope to branch `dev`) with **dev** Convex URLs:


| Variable               | Value                                        |
| ---------------------- | -------------------------------------------- |
| `VITE_CONVEX_URL`      | `https://resilient-lemming-288.convex.cloud` |
| `VITE_CONVEX_SITE_URL` | `https://resilient-lemming-288.convex.site`  |


### 2. Branch deploys

1. Go to **Site settings** → **Build & deploy** → **Branches and deploy contexts**.
2. Set **Production branch** to `main`.
3. Under **Branch deploys**, choose “Let me add individual branches” and add `dev`.

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

---

## After this release (PEPL-50)

PEPL-50 renamed "Work Address Code" to "Company Number". After deploying, run this once to copy existing values into the new field:

```bash
npx convex run --prod employees/mutations:migrateWorkAddressCodeToCompanyNumber
```

Returns `{ migrated, total }`. Remove this section once done.