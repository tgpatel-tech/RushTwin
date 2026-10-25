# RushTwin on GitHub Pages

Repository: https://github.com/tgpatel-tech/RushTwin

Website:
https://tgpatel-tech.github.io/RushTwin/

Public demo:
https://tgpatel-tech.github.io/RushTwin/#/demo

## One-time repository setting

1. Open https://github.com/tgpatel-tech/RushTwin/settings/pages while signed into the repository owner's account.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open the repository's **Actions** tab and choose **Test and deploy RushTwin to GitHub Pages**.
4. If the initial run failed before Pages was enabled, use **Re-run all jobs**, or **Run workflow** on `main`.
5. Wait until both **build** and **deploy** are green. Open the deployment URL that GitHub reports.

For the usual free GitHub Pages setup, the repository must be public. If it is private, check your plan's Pages eligibility. Do not change repository visibility without reviewing what will become public. The app does not contain API keys or require account credentials.

The workflow installs locked dependencies, runs lint/type/unit tests, builds in GitHub mode, browser-tests the actual Pages build, uploads the artifact, and deploys it. GitHub supplies its scoped workflow token; no personal access token is embedded in the application.

## Why the address includes #

GitHub Pages does not support arbitrary server rewrites for client-side routes. The Pages build uses HashRouter so `/RushTwin/#/demo` and project links refresh without a 404. This changes URL structure, not application features. Assets and sample downloads use `/RushTwin/`. Root-domain builds using `npm run build` still use standard browser routing.

## Local verification

```sh
npm ci
npm run lint
npm run typecheck
npm run test
npm run test:e2e:pages
```

Playwright uses an installed Chromium, or run `npx playwright install chromium`. `npm run build:pages` builds the site without launching tests. The Pages test server uses port 4175.

## Sharing projects

Saved projects stay in the browser. Use the public demo for a shared starting point, or export a `.rushtwin.json` file to share a custom project.
