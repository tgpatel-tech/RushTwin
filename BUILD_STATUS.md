# Build status

## CORE ENGINE

Implemented: stable binary event heap, FIFO queues, seeded distributions, piecewise Poisson demand, parallel dependency joins, worker capacity, unfinished customers, exact queue area, utilization, percentiles, throughput, and evidence-based bottleneck ranking. Mandatory single-worker and parallel timing examples pass.

## WORKFLOW EDITOR

Implemented: four templates, draggable stations, directed connections, station creation/deletion, naming, workers, simple/advanced service distributions, order-type station membership, validation, and undo/redo. Browser verification confirmed drag movement and exact undo restoration.

## PLAYBACK

Implemented: recorded-run playback, pause/resume, 1/2/5/10× and Max, restart, seek, customer/queue tokens, customer inspector, live metrics, results table, queue/wait charts, intensity timeline, event filtering, customer results and CSV export. Motion is illustrative; physical travel time is not modeled.

## SCENARIOS

Implemented: duplication with independent configuration, naming, selection, fixed-demand replay, and immutable run snapshots. Demo provides the five-worker reallocation experiment. Latest runs per scenario are offered in comparison.

## COMPARISON

Implemented: actual same-demand equality check, average/P90 wait, max queue, throughput, completed count, bottleneck shifts, staffing/service/routing/type differences, total staffing, and equal-time queue overlays. Results can show both improvement and deterioration.

## CSV IMPORT

Implemented: local upload/drop, 10 MB limit, mapping, numeric/clock/ISO timestamps, ID/type/temporal validation, row error reports, explicit invalid-row skipping, 10,000-arrival limit, normalized replay scenarios, and valid/invalid samples. Structural parsing errors must be corrected before import.

## PERSISTENCE

Implemented: Dexie projects and runs, serialized/debounced autosave, save status, transition flush, project copy/delete, JSON export, Zod-validated reimport. Browser tests verified reload persistence and JSON round trips. Export excludes historical runs.

## RESPONSIVE DESIGN

Implemented: desktop canvas/inspector/results layout, tablet inspector overlay, mobile Workflow/Run/Results tabs and station sheet, packaged Inter fonts, Lucide icons, focus rings, reduced-motion styling, native modal dialogs, and chart descriptions. Desktop and 390 px mobile views were visually inspected; mobile dashboard/editor have no horizontal document overflow.

## TESTING

25 unit/component tests, 2 root-hosted Chromium E2E journeys, and the separate GitHub Pages browser journey have passed in the development environment. Typecheck and ESLint pass. Production build passes with route-level code splitting. See TESTING.md for the exercised paths and browser limitations.

## DOCUMENTATION

README, ARCHITECTURE, SIMULATION_ENGINE, COMPETITION_EXPLANATION, AI_USAGE, TESTING, and this status file are provided. Personal inspiration, contribution, and testing records are collected in docs/SUBMISSION_WORKSHEET.md for truthful completion.

## KNOWN ISSUES / LIMITATIONS

- No backend, collaboration, account system, remote sync, worker schedules, abandonment, shared worker pools, or cyclic workflows.
- Normal/truncated service distributions can shift actual means; cumulative parallel queue/processing effort is not elapsed customer time. These semantics are displayed and documented.
- Very large workloads beyond the validated 1,000-customer/20-station target can occupy the main thread; a Web Worker and automatic staffing search are not implemented.
- Project exports omit run histories. Browser storage can be cleared or quota-limited; export backups.
- Connection tokens indicate recent recorded transfers and do not model travel durations. Queue charts are sampled for display; metrics use exact timings.
- The owner has confirmed the GitHub Pages website opens. Saved simulations remain browser-local; public demo links create a separate demo for each visitor.

## GITHUB PAGES

A Pages-specific build, subdirectory-safe assets, hash routing, production browser test, and Actions deployment workflow are included. The owner confirmed the public website works. The Pages browser test validates the demo, comparison, refresh, and import under the hosted path.
