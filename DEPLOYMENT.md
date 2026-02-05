# Deployment Guide: Convex Dev/Prod + Netlify

This app uses **two Convex deployments** (dev and production) and **Netlify branch deploys** (dev and main).

## Convex deployments

| Environment | Deployment        | URL |
|-------------|-------------------|-----|
| Dev         | resilient-lemming-288 | https://resilient-lemming-288.convex.cloud |
| Production  | energized-squirrel-967 | https://energized-squirrel-967.convex.cloud |

---

## Netlify setup

### 1. Environment variables

In **Netlify Dashboard** → your site → **Site settings** → **Environment variables**:

#### Production (main branch)

Add these for **Production** context (or scope to branch `main`):

| Variable | Value |
|----------|-------|
| `VITE_CONVEX_URL` | `https://energized-squirrel-967.convex.cloud` |
| `VITE_CONVEX_SITE_URL` | `https://energized-squirrel-967.convex.site` |

#### Branch deploys (dev branch)

Add the same variable names for **Branch deploys** (or scope to branch `dev`) with **dev** Convex URLs:

| Variable | Value |
|----------|-------|
| `VITE_CONVEX_URL` | `https://resilient-lemming-288.convex.cloud` |
| `VITE_CONVEX_SITE_URL` | `https://resilient-lemming-288.convex.site` |

### 2. Branch deploys

1. Go to **Site settings** → **Build & deploy** → **Branches and deploy contexts**.
2. Set **Production branch** to `main`.
3. Under **Branch deploys**, choose “Let me add individual branches” and add `dev`.

---

## Local development

Keep `.env.local` pointing at **dev** (do not commit this file):

```env
CONVEX_DEPLOYMENT=dev:resilient-lemming-288
VITE_CONVEX_URL=https://resilient-lemming-288.convex.cloud
VITE_CONVEX_SITE_URL=https://resilient-lemming-288.convex.site
```

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
