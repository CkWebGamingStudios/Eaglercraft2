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
- pushes that change `src/elge/**`
- manual trigger (`workflow_dispatch`)

Configure this in your GitHub repository settings:
- `SYNC_TOKEN` as an **Actions secret** (preferred): a personal access token with write access to `CkWebGamingStudios/Elge`
- Optional fallback: `SYNC_TOKEN` as an **Actions variable** if secrets are unavailable in your workflow context


### Troubleshooting "permission denied to github-actions[bot]"

If you see errors like `Permission to CkWebGamingStudios/Elge.git denied to github-actions[bot]`, your `SYNC_TOKEN` is not authorized for that target repo.

Use a token from an account that has write access to `CkWebGamingStudios/Elge`:
- Recommended: classic PAT with `repo` scope.
- Fine-grained PAT also works if it includes **Contents: Read and write** on that repository.
- Do **not** use `GITHUB_TOKEN`/runtime tokens (`ghs_`/`ghu_`); they cannot push to an external repository.

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

## Cloudflare Access header checks

The app checks for `Cf-Access-Jwt-Assertion` before showing authenticated UI.

- By default, auth header checks are required on non-local hosts and skipped on `localhost`/`127.0.0.1`.
- You can explicitly control protected hosts with:

```bash
VITE_CF_ACCESS_REQUIRED_HOSTS=play.example.com,staging.example.com
```

If you still see auth failures in browser console, verify:
- Cloudflare Access CORS allows exposing `Cf-Access-Jwt-Assertion`.
- Service Token / Access policy is valid for the route.
- You are signed in to Access for the current hostname.
