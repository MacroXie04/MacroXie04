# CI/CD operator runbook

This repository builds the static portfolio once in GitHub Actions and promotes that verified artifact to the existing Cloudflare Pages project, `dev`. GitHub Actions is the only intended deployment controller after cutover.

## Delivery flow

1. Pull requests to `main` run `CI` and CodeQL. Inside the required `CI` check, the dependency review runs before the audit; CI then lints with zero warnings, runs the coverage-gated test suite, verifies the resume, builds and validates `pages/build`, and generates an SBOM.
2. A successful `CI` run from a push or manual dispatch on this repository's `main` branch uploads `pages-build-<commit-sha>`. The artifact includes `deploy-meta.json` and `SHA256SUMS`; deployment verifies both against the trusted CI run and commit.
3. `Deploy Cloudflare Pages` runs only when the repository kill switch is enabled. A Cloudflare-credential-free preflight accepts only a successful `CI` run from this repository's current `main`, and skips deployment idempotently when production metadata already identifies that commit.
4. Its single deploy job uses the `cloudflare-pages-production` environment. It downloads, verifies, and freezes the artifact once; deploys it to the `production-candidate` branch; and checks the candidate's immutable URL and `noindex` header before continuing.
5. In the same job, production records the current Cloudflare deployment as the rollback target, uploads the identical frozen artifact to branch `main`, and verifies both the immutable deployment URL and `https://hongzhexie.com` against the expected commit SHA. There is no approval pause between candidate and production.
6. `Roll back Cloudflare Pages` is manual and serialized with production deployments. It validates a prior successful production deployment and its exact commit before moving the production pointer.

CodeQL also runs weekly. CI artifacts and coverage are retained for 14 days; SBOMs are retained for 30 days.

## Required GitHub configuration

Use these names and scopes exactly:

| Scope | GitHub resource | Name | Setting |
| --- | --- | --- | --- |
| Repository | Actions variable | `CLOUDFLARE_DEPLOY_ENABLED` | `false` during setup or an incident; `true` only when automated deployment is armed |
| Repository | Actions variable | `CLOUDFLARE_PAGES_PROJECT` | `dev` |
| Repository | Actions variable | `PRODUCTION_URL` | `https://hongzhexie.com` |
| Environment | Environment | `cloudflare-pages-production` | Allow deployments from `main` only; do not add required reviewers, wait timers, or a manual approval rule |
| Production environment | Actions variable | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account containing project `dev` |
| Production environment | Actions secret | `CLOUDFLARE_API_TOKEN` | Scoped only to **Account → Cloudflare Pages → Edit** |

Never put a Cloudflare token or account value in this document, source control, an Actions log, or a repository-wide setting. The `CI` build job has no GitHub environment and receives **no Cloudflare credentials**. Environment-scoped credentials are available only to the combined deploy job and the rollback job. GitHub's automatically supplied `GITHUB_TOKEN` is used only for repository operations such as downloading the trusted build artifact.

## GitHub security settings

- Keep the existing `CI` required status check on the `main` ruleset. Do not rename or remove it.
- In **Repository Settings → Code security and analysis**, enable secret scanning and push protection.
- Let CodeQL complete successfully once so GitHub has a result for this repository. Then edit the `main` ruleset, add a code-scanning merge rule for CodeQL, and set its security-alert threshold to **High or higher**. This blocks merges with high or critical CodeQL findings while allowing the scheduled and manually dispatched scans to continue reporting lower-severity findings.

## Initial cutover

Keep the current production site serving throughout this sequence:

1. Create the repository variables `CLOUDFLARE_DEPLOY_ENABLED=false`, `CLOUDFLARE_PAGES_PROJECT=dev`, and `PRODUCTION_URL=https://hongzhexie.com`. A missing or false deploy switch also keeps deployment off.
2. Create the single GitHub environment `cloudflare-pages-production`, add its exact variable and secret, and restrict it to `main`. Do not configure required reviewers, a wait timer, or another manual approval requirement.
3. Merge the CI/CD workflows while the kill switch remains false. Confirm the `main` push passes `CI` and produces `pages-build-<commit-sha>`; the deployment workflow should show its preflight and deploy jobs as skipped.
4. In Cloudflare, open **Workers & Pages → dev → Settings → Builds & deployments**. Disable automatic production-branch deployments and set preview-branch deployments to **None**. Keep the disabled Git connection attached during burn-in; do not delete the Pages project, its custom domain, or prior deployments.
5. Confirm a GitHub push no longer creates a Cloudflare-native Git build or preview. Direct uploads from Wrangler must remain enabled; those are what the GitHub workflows use.
6. Set `CLOUDFLARE_DEPLOY_ENABLED` to `true`, then manually dispatch the **CI** workflow from branch `main`. Changing the variable alone does not start deployment.
7. Confirm the single deploy job verifies the artifact, deploys and smoke-tests the candidate, and then proceeds sequentially to production without an approval pause.
8. Confirm the job records both the new deployment and the previous deployment ID in its summary.
9. Complete the production checks below. If anything is uncertain, set `CLOUDFLARE_DEPLOY_ENABLED` back to `false` before investigation.

## Production verification

The workflow checks the exact `deploy-meta.json` commit SHA and CI run ID, page title and React root, manifest contract, referenced JavaScript/CSS assets, resume PDF checksum and size, canonical/Open Graph URLs, robots policy, and sitemap. Operators should also inspect these URLs after cutover:

- `https://hongzhexie.com/`
- `https://hongzhexie.com/deploy-meta.json` — `commitSha` and `runId` must match the deployed commit and source CI run
- `https://hongzhexie.com/manifest.json`
- `https://hongzhexie.com/robots.txt`
- `https://hongzhexie.com/sitemap.xml`
- `https://dev-aqz.pages.dev/` — Cloudflare's stable production fallback for project `dev`
- The immutable production URL recorded in the deployment summary

Verify that the homepage and assets return successful responses, the custom domain and Cloudflare fallback show the same release, robots and sitemap reference `https://hongzhexie.com`, and no Cloudflare-native Git build was created. Preserve the workflow summary because it contains the exact prior deployment ID needed for rollback.

## Manual rollback safeguards

Rollback is deliberately not automatic:

1. Set `CLOUDFLARE_DEPLOY_ENABLED` to `false` so another CI completion cannot race the incident response. This stops future automatic deploys; it does not take the current site offline or disable rollback.
2. From the last known-good production deployment, obtain its lowercase deployment UUID from Cloudflare and the successful workflow summary. Never guess the value.
3. In GitHub Actions, select **Roll back Cloudflare Pages**, choose branch `main`, and supply:
   - `deployment_id`: the validated prior production deployment UUID
   - `confirmation`: enter the exact free text `ROLLBACK dev`
4. Submit the run. There is no environment reviewer or manual approval step after submission.
5. Confirm the workflow derives the target's commit SHA from Cloudflare, validates that the target is a successful production deployment for project `dev`, rejects the current deployment as a target, preflights the immutable target, moves the production pointer, waits for it to settle, and smoke-tests the immutable URL and configured production URL.
6. Leave the kill switch false until the incident is resolved. Re-arm it only before a reviewed corrective push to `main`.

The workflow does nothing when dispatched from a ref other than `main` or when the confirmation text is not exactly `ROLLBACK dev`. The shared production concurrency group prevents rollback and deployment from running concurrently.

## Retire legacy delivery only after burn-in

Do not remove fallback integrations during initial cutover. Declare burn-in complete only after the agreed observation window includes multiple successful `main` releases, stable custom-domain checks, correct deployment metadata, and no unexpected Cloudflare-native builds.

After that decision is recorded:

1. In **Repository Settings → Pages**, disable/unpublish GitHub Pages. Verify the live custom domain still resolves to Cloudflare and remains healthy.
2. Only then delete the legacy GitHub environment named `github-pages` and any Pages-only deployment configuration. Do not remove either while it is still serving or needed for fallback.
3. In **Repository Settings → Webhooks**, identify the webhook that belongs specifically to this repository's old AWS Amplify integration by its endpoint and recent deliveries. Disable it first, observe that GitHub Actions/Cloudflare delivery remains healthy, and then delete only that repository-specific Amplify webhook. Do not change organization-wide or unrelated AWS webhooks.

Keep the Cloudflare Pages project, custom-domain/DNS configuration, deployment history, and `cloudflare-pages-production` environment in place for normal operation and rollback.
