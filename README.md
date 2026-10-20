# RushTwin

**Test the rush before it happens.** A local-first visual operations simulator for queue-based service workflows. Build a workflow, run a real discrete-event simulation, change capacity, replay identical demand, and compare results.

## GitHub website

GitHub Pages deployment is configured for this repository. See [GitHub Pages setup](deployment/GITHUB_PAGES.md) for enabling it and verifying the public challenge demo. The expected website is `https://tgpatel-tech.github.io/RushTwin/`; deployment must succeed before that address is usable.

## Run locally

Node.js 22.12+ (validated on Node 24) and npm are required.

```sh
npm ci
npm run dev
```

Open the address Vite prints. No backend, API key, account, or paid service is required. Project data stays in the browser's IndexedDB. Export `.rushtwin.json` backups before clearing browser storage.

## Validate

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Playwright uses `/usr/bin/chromium` when installed. Otherwise run `npx playwright install chromium` or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an installed Chromium executable. Use `npm run preview` to serve the production build. Static hosting must rewrite unknown routes to `index.html`.

## Try the experiment

1. Open **Try Demo Rush**.
2. Run Baseline. Pause, resume, change speed, or select Max.
3. Inspect Drinks and its growing queue. Results show measured queue delay, utilization, and throughput.
4. Choose **Test a Change** and **Apply Experiment**: Order 2 → 1, Drinks 1 → 2. Total workers remains five.
5. **Replay Same Rush**, then compare.
6. Import `public/samples/sample_rush.csv`, map columns, validate, and create a replay scenario.

The preset produces 110 customers at seed 473829. These are generated arrivals, not hardcoded results. A higher central arrival rate makes the constraint visible. Full-run throughput includes time to drain the system after arrivals stop.

## Main capabilities

- Four templates and a draggable, connectable XYFlow editor; worker and distribution controls; routing validation; undo/redo.
- Custom stable event min-heap, efficient FIFO queues, Mulberry32 random generation, Poisson/rush demand, dependency joins, zero-worker unfinished orders.
- Event-derived playback, pause/resume, scrubbing, queue tokens, customer detail, metrics, station tables, charts, timeline, and filtered event log.
- Independent scenarios, names, fixed-demand replay with customer/station-specific service sub-seeds, and comparison of measured outcomes.
- CSV mapping and row validation, invalid-row reports, explicit skipping, sample files, Zod-validated project import/export.
- Debounced local persistence, desktop workspace and mobile Workflow/Run/Results views.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Engine semantics and formulas](SIMULATION_ENGINE.md)
- [Testing](TESTING.md)
- [Build status and limitations](BUILD_STATUS.md)
- [Competition explanation](COMPETITION_EXPLANATION.md)
- [AI usage disclosure](AI_USAGE.md)

RushTwin estimates behavior under user assumptions; it does not guarantee real-world outcomes. It is not an employee monitoring system or an automatic staffing recommendation engine.

## Your own website

See [deployment instructions](deployment/README.md) for standalone hosting and a custom domain. The prepared `releases/rushtwin-website.zip` contains the production website; `releases/rushtwin-source.zip` contains the editable source. Netlify routing/build configuration is included. A live deployment and domain connection require your hosting account. Export existing browser-local projects before changing domains.
