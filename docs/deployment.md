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
- **The SPA fallback rewrite is load-bearing.** The client routes on the path
  (`/logg-inn`, `/profil`), and the only document this site publishes is
  `index.html` — so without `/* /index.html 200` in `netlify.toml`, a reload or a
  shared link on any route but `/` is a 404 from Netlify's static server and the
  router never runs. It must stay *below* the `/api/*` rule: Netlify applies the
  first match, and a catch-all above it would swallow the API proxy. (The map's
  viewport still lives in the URL fragment, which no server ever sees.)
- Assets are referenced from the root (`/assets/…`), so the site must be served
  from a domain root. Deploying under a subpath would need `base` set in
  `vite.config.ts`.

`netlify.toml` holds cache headers, security headers, the API proxy and the SPA
fallback — no build command, by design. The `Permissions-Policy` header there must
keep `geolocation=(self)`.

## The API proxy

`netlify.toml` rewrites `/api/*` to the API's `/v1/*` on Azure Container Apps with
`status = 200`, which proxies rather than redirects. The client therefore calls its
own origin and CORS never enters the deployed path — see [api.md](api.md).

Two consequences for a deploy:

- **The API hostname is in `netlify.toml`.** If the Container App is recreated, its
  FQDN changes and that line has to change with it. The symptom is peaks failing to
  load while the rest of the site is fine.
- **The first request after an idle period may fail at the edge.** The API scales to
  zero and its database auto-pauses; a resume can outlast Netlify's upstream proxy
  timeout. The map reports it and offers a retry rather than appearing broken.
