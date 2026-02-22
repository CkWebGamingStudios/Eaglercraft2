# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## ELGE sync to external repository

This repo includes an automated sync for `src/elge` so you can host the engine separately (for example on Fly.io).

Target repo is fixed to:
- `https://github.com/CkWebGamingStudios/Elge.git`
- branch `main`

### GitHub Actions automation

The workflow is `.github/workflows/sync-engine.yml` and runs on:
- pushes to `main` that change `src/elge/**`, `scripts/sync-elge.sh`, or the workflow file
- manual trigger (`workflow_dispatch`)

Configure this in your GitHub repository settings:
- `SYNC_TOKEN` as an **Actions secret** (preferred): a personal access token with write access to `CkWebGamingStudios/Elge`
- Optional alternate secret name: `ELGE_SYNC_TOKEN`
- Optional fallback: `SYNC_TOKEN` as an **Actions variable** if secrets are unavailable in your workflow context



Workflow hardening included:
- Runs only on `main` pushes (avoids failing sync attempts on feature branches without prod secrets).
- Validates and masks token before use, and rejects `ghs_` / `ghu_` runtime tokens.
- Cleans up existing temp subtree branch before split to avoid branch-exists failures.
- Uses `timeout-minutes: 10` to prevent stuck jobs.

### Troubleshooting "permission denied to github-actions[bot]"

If you see errors like `Permission to CkWebGamingStudios/Elge.git denied to github-actions[bot]`, your `SYNC_TOKEN` is not authorized for that target repo.

Use a token from an account that has write access to `CkWebGamingStudios/Elge`:
- Recommended: classic PAT with `repo` scope.
- Fine-grained PAT also works if it includes **Contents: Read and write** on that repository.
- Do **not** use `GITHUB_TOKEN`/runtime tokens (`ghs_`/`ghu_`); they cannot push to an external repository.
- If your org uses SSO, authorize the PAT for SSO access or pushes will still fail.
- Confirm the PAT owner is a collaborator/member with write access on the target repo itself.

### Manual local sync script

You can sync locally with defaults (target repo + `main` branch):

```bash
export SYNC_TOKEN=ghp_xxx
scripts/sync-elge.sh
```

You can still override repo/branch explicitly:

```bash
scripts/sync-elge.sh CkWebGamingStudios/Elge main <token>
```

## Cloudflare Access UID lookup

The home screen asks for a Cloudflare Access user UID, then requests `last_seen_identity` through a server-side proxy.

Why this change:
- Direct browser calls to Cloudflare API usually fail with `Failed to fetch` due to CORS.
- API bearer tokens must stay server-side and not be embedded in browser JavaScript.

### Dev setup (Vite proxy)

Set a local environment variable before running dev:

```bash
export CF_API_TOKEN=<your_cloudflare_api_token>
npm run dev
```

The app calls `/api/cloudflare/accounts/<account_id>/access/users/<uid>/last_seen_identity`, and Vite proxies to:
- `https://api.cloudflare.com/client/v4/...`
- with `Authorization: Bearer $CF_API_TOKEN` injected server-side.

### Production setup


### Cloudflare Pages production proxy (recommended for this repo)

If `https://eaglercraft2ck.pages.dev/api/cloudflare` shows your normal site HTML, the Pages Function route is not active.

This repo now includes a Pages Function proxy at:
- `functions/api/cloudflare/[[path]].js`
- Added `functions/api/cloudflare/identity.js` to auto-resolve UID from current Cloudflare Access session (`cf-access-jwt-assertion` / `CF_Authorization`) and return `user_uuid` for the UI "Detect UID" flow.

To enable it on Cloudflare Pages:
- In Pages project settings, set environment secret `CF_API_TOKEN` (Production + Preview).
- Redeploy the site so Functions are published.
- Test endpoint (expect JSON, not HTML):
  - `/api/cloudflare/accounts/<account_id>/access/users/<uid>/last_seen_identity`

Default client request path is: `/api/cloudflare` (same-origin).

You can configure either of these options:
- Preferred: configure your production host/server to proxy `/api/cloudflare/*` to Cloudflare API and inject authorization server-side.
- Optional: set a custom proxy base URL with:

```bash
VITE_CF_IDENTITY_PROXY_URL=https://your-server.example.com/cloudflare/client/v4
```

Your proxy endpoint must forward requests to Cloudflare API and inject authorization server-side.

- If you see raw HTML (like `<!doctype html>` / sitemap/head/body markup) in the lookup message, your host is returning the SPA HTML fallback instead of proxying `/api/cloudflare/*`.
How to find the UID in CkWebGaming Studios Cloudflare Access App Launcher:
- Open the App Launcher.
- Open your profile / identity details.
- Copy the user UID and paste it into the app prompt.
