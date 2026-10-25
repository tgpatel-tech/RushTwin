# Testing

## Commands

`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e`.

Vitest runs unit and component tests in jsdom. The Playwright suite starts/reuses Vite on port 5173 and uses isolated browser contexts. System Chromium is used if present; otherwise install Playwright Chromium or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.

## Engine and input coverage

- Binary heap ordering and stable event ties; FIFO compaction.
- 0/1/2-arrival, two-second service example, exact waits, queue area, utilization, P90, throughput.
- Multiple workers; zero workers and unfinished tasks; empty demand.
- parallel join, deterministic repeated execution, staffing replay preserving demand and individual service durations.
- Seeded sequences; fixed, uniform, normal, triangular distributions; piecewise Poisson demand; percentiles.
- Cycle/disconnection/configuration validation; CSV valid/invalid rows, malformed CSV, timestamps, project schema/version.
- 1,000-customer/20-station engine case.
- Worker edit isolation and undo via React Testing Library.

## Browser coverage

The browser journeys cover project creation using Café Rush, run/pause/resume/Max, customer inspection, scenario duplication, worker edits, same-rush replay, comparison, refresh persistence, CSV mapping/import/run, demo experiment, JSON export/import, invalid-row skipping, and mobile dashboard overflow. Runtime page errors are asserted absent in the main journey.

## Manual review

Inspect desktop and mobile screenshots; check keyboard focus, dialog close, long names, zero-worker warning, and full results tables. Charts have accessible descriptions and station data tables; timeline cells expose counts on focus/hover. Native dialog handles modal keyboard focus.

Do not infer universal browser/device compatibility from Chromium coverage. Test on the devices and browsers you plan to use.

## Standalone production verification

`npm run test:e2e:production` builds the actual static bundle, serves it with Vite preview on port 4174, and runs the same browser journeys against that bundle. This catches production chunk-loading failures that development-server tests cannot detect.

## GitHub Pages verification

`npm run test:e2e:pages` builds with the `/RushTwin/` asset base and hash routing, then checks the demo, staffing replay, comparison, refresh, sample download, CSV import/run, and technical page on the real Pages build. GitHub Actions runs this before deployment.
