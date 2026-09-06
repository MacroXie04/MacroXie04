# Updating portfolio content

Edit the canonical JSON files in `assets/data/content/`: `profile`, `education`, `experience`, `additional`, `projects`, and `skills`.

From `pages`, run `npm run sync:content` after changing those files. It regenerates the contact entries, terminal README/experience/skills documents, virtual project files, and initial HTML portfolio. The build and CI tests run `verify:content` and reject stale generated content. Do not edit the generated copies by hand.

Project `caseStudy` records contain the problem, engineering decision, walkthrough steps, and evidence links. Keep evidence links pinned to a reviewed commit and update them when revising a claim. The walkthroughs explain architecture; they do not call the project APIs or imply a live benchmark.

The PDF and LaTeX source remain in `assets/resume`. After updating the CV, update the shared website facts above. Regenerate the PDF and refresh `resumePdf` checksums in `assets/data/terminal/filesystem.json`; `npm run verify:resume` checks that the two assets match their metadata. Content synchronization preserves this metadata.

Project detail links use the existing hash router: `/#/projects/tokenrouter` and `/#/projects/mobileid`. The HTML fallback exposes project details and evidence without requiring JavaScript. The site-wide social preview is `assets/og.png`, referenced by the Open Graph and X card metadata in `pages/index.html`.
