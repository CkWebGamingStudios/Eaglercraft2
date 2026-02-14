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

The home screen now asks for a Cloudflare Access user UID first, then fetches the user's `last_seen_identity` from Cloudflare API.

Request used by the app:

```text
GET https://api.cloudflare.com/client/v4/accounts/432016fb922777d8a5140c9b3b3d37f3/access/users/<uid>/last_seen_identity
Authorization: Bearer rVzipJyDnWRD5kGOCgKE9LTn0eWE8Wa7_-B9WHdJ
```

How to find the UID in CkWebGaming Studios Cloudflare Access App Launcher:
- Open the App Launcher.
- Open your profile / identity details.
- Copy the user UID and paste it into the app prompt.
