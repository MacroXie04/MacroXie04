# CI/CD operator runbook

Cloudflare Pages builds and deploys this static portfolio through the official **Cloudflare Workers and Pages GitHub App**. GitHub Actions runs CI and CodeQL; Cloudflare is the deployment controller. The existing Pages project is `dev`, with production at `https://hongzhexie.com` and fallback at `https://dev-aqz.pages.dev`.

## GitHub App access

Install or configure **Cloudflare Workers and Pages** for the `MacroXie04` account. Select **Only select repositories** and authorize only `MacroXie04/MacroXie04`. Keep this installation connected to the existing Pages project; do not recreate the project or change its custom domains.

GitHub does not need a Cloudflare API token for this delivery path. Do not add Cloudflare credentials to repository files, Actions secrets, or build logs.

## Delivery flow

1. Pull requests to `main` must pass the existing required `CI` check. CI reviews dependency changes, audits dependencies, lints with zero warnings, runs the coverage-gated tests, verifies shared content and the resume, and builds and validates `pages/build`. CodeQL runs separately and weekly.
2. Merge reviewed changes into `main`. The GitHub App notifies Cloudflare, which installs dependencies and builds that commit using the settings below.
3. Cloudflare publishes a successful production build to the existing Pages project and custom domain. A failed build does not replace the last successful deployment.
4. Review the **Cloudflare Pages** check in GitHub and the exact deployed commit in Cloudflare's Deployments page. Cloudflare builds its own output rather than downloading the GitHub Actions artifact. Production deployment does not wait for the additional CI run triggered after the merge; the protected PR check is the merge gate.

## Cloudflare Pages configuration

| Setting | Value |
| --- | --- |
| Connected repository | `MacroXie04/MacroXie04` |
| Framework preset | React (Vite) |
| Production branch | `main` |
| Automatic production deployments | Enabled |
| Automatic preview deployments | None |
| Root directory | `pages` |
| Build command | `npm run build` |
| Build output directory | `build` |
| Build system | Version 3 |
| Node version file | `pages/.nvmrc`: `24.18.1` |

The configured output matches `pages/vite.config.mjs`. The prebuild script verifies shared content and the one-page resume. The Node version file is inside the configured build root so Cloudflare detects it; it matches the repository-root `.nvmrc`, `pages/package.json`, and the GitHub CI runtime. Do not rely on `package.json` engines to select the Cloudflare runtime. Keep the repository root available during builds because shared assets live in `assets/` alongside `pages/`.

## GitHub configuration

Keep the existing `main` ruleset, required `CI` status, resolved review discussions, CodeQL, and fixed action commit references. Keep force pushes and branch deletion blocked. No Cloudflare token is required in GitHub for native Git deployment.

The old token-based deployment and rollback workflows are archived in `docs/legacy-workflows/`; GitHub Actions does not execute workflows in that directory. Keep the legacy `CLOUDFLARE_DEPLOY_ENABLED` variable false while it remains in repository settings so an older workflow cannot be accidentally re-armed. The remaining project URL variables and `Cloudflare Production` environment are reference configuration, not an alternative deployment controller.

GitHub CI artifacts and coverage are retained for 14 days; SBOMs are retained for 30 days. CI's artifact metadata describes that CI build and is not the release marker for Cloudflare's independently built output.

## Verify a release

1. In Cloudflare Pages → `dev` → Deployments, verify a **successful Production** deployment from `main` whose commit matches the intended merge commit.
2. Open the immutable deployment URL, `https://hongzhexie.com/`, and `https://dev-aqz.pages.dev/`. Check the page title, navigation, terminal, JavaScript/CSS assets, and resume download.
3. Check `manifest.json`, `robots.txt`, and `sitemap.xml`; canonical and social URLs must point to `https://hongzhexie.com`.
4. Use Cloudflare's deployment commit and build log as the release record. Native builds do not inherit GitHub Actions' `deploy-meta.json` or its CI run ID.

## Rollback and pause

Use Cloudflare Pages → `dev` → Deployments to select a previously successful production deployment and roll back. Verify the restored commit and production domain afterwards. If a release incident needs investigation, disable **automatic production branch deployments** in Cloudflare's Branch control settings; this leaves the current site serving.

The old GitHub Actions rollback workflow is archived and should not be used for native Git deployments. Do not delete the Pages project, DNS records, custom domains, or deployment history during recovery.
