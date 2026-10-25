# Hosting

RushTwin is a static web app. It needs no backend or API keys.

## GitHub Pages

Follow the [GitHub Pages setup](GITHUB_PAGES.md). This build uses `/RushTwin/` as its base path and hash-based routes.

## Root-domain hosting

Run `npm ci` and `npm run build`, then deploy `dist` to a static HTTPS host. For Netlify, connect the repository with build command `npm run build` and publish directory `dist`, or upload the built folder manually.

Other hosts need a fallback to `/index.html` for routes such as `/demo` and `/project/:projectId`. Use `npm run preview` only for local checks.

Run `npm run test:e2e:production` before deploying a root-domain build. Test direct links and refresh on the live site too.

## Moving saved projects

Browser storage does not move between domains or devices. Export projects as `.rushtwin.json` files and import them on the new site. Rerun simulations to restore results; exports omit run histories.
