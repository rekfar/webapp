# Deployment

The build is produced by GitHub Actions and uploaded to Netlify as a static
bundle. Netlify does **not** build this repo — the project must stay
_unconnected_ from Git in the Netlify UI, or it will try to build on push and
race the pipeline.

Workflow: `.github/workflows/deploy.yml`

| Trigger | Result |
| --- | --- |
| Push to `main` | Production deploy (`--prod`) |
| Pull request | Draft deploy; the preview URL is commented on the PR |
| Fork pull request | Build and typecheck only — no secrets, so the deploy step is skipped |

`npm run build` runs `tsc -b` first, so CI has no separate typecheck step.

## Required repository secrets

Set under _Settings → Secrets and variables → Actions_:

| Secret | Where to find it |
| --- | --- |
| `NETLIFY_AUTH_TOKEN` | Netlify _User settings → Applications → Personal access tokens_ |
| `NETLIFY_SITE_ID` | Netlify _Project configuration → General → Project details_ |

Netlify's UI labels that second value **Project ID** — it renamed Sites to
Projects — but the CLI, API and environment variable still say `site`, so the
secret name is `NETLIFY_SITE_ID`.

`netlify-cli` is pinned to an exact version in the workflow's `env` block rather
than tracking `@latest`, so an upstream release cannot break `main`. That version
of the CLI requires Node ≥ 22.13, which is what `.nvmrc` reflects. The app itself
builds fine on Node 20.11.

## Hosting constraints

- **HTTPS is mandatory.** The geolocation API is secure-context only, so "Show my
  position" silently fails over plain HTTP. Netlify provisions TLS automatically.
- **No SPA fallback redirect is needed.** The viewport lives in the URL _fragment_,
  so the server only ever sees a request for `/`. A `/* /index.html 200` rule
  would be dead config.
- Assets are referenced from the root (`/assets/…`), so the site must be served
  from a domain root. Deploying under a subpath would need `base` set in
  `vite.config.ts`.

`netlify.toml` holds cache and security headers only — no build command, by
design. The `Permissions-Policy` header there must keep `geolocation=(self)`.
