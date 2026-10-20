# Architecture

## Boundaries

`src/types/model.ts` defines serializable entities shared across layers. Core simulation modules have no React, DOM, chart, or storage dependency; browser-provided `crypto.randomUUID()` labels run records without affecting numerical outcomes.

- `simulation/queue.ts`: binary min-heap ordered by time and sequence; FIFO with head index and amortized compaction.
- `simulation/random.ts`: Mulberry32, weighted choices, service distributions, deterministic sub-seeds.
- `simulation/demand.ts`: fixed RunDemand creation from piecewise Poisson arrivals.
- `simulation/validation.ts`: graph/configuration validation and selected-task dependency contraction.
- `simulation/engine.ts`: customer lifecycle, capacity reservation, queues, service completion, joins, trace, station metrics.
- `simulation/metrics.ts`: customer summaries and interpolated percentiles.
- `simulation/playback.ts`: reconstructs customer/worker/queue state at arbitrary timestamps; does not rerun the engine.
- `persistence/`: templates, schema validation, CSV mapping/validation, Dexie tables.
- `stores/editor.ts`: immutable editor snapshots, bounded undo/redo, debounced serialized writes, route flush.
- `stores/playback.ts`: playback clock, run, speed, and view state. Animation frames are never persisted.
- `features/`: dashboard, canvas, inspector, project orchestration, results, comparison, import, technical explanation.
- `components/`: shell, accessible native-dialog wrapper, charts, and shared presentation.

## Data ownership

A Project contains independently cloned Scenarios. Each scenario holds its graph, worker/service settings, order types, demand settings, and optional fixed replay. A Run contains an immutable configuration snapshot, RunDemand, numerical results, and event trace. Dexie stores projects and runs in separate tables. Results remain labeled with the run's configuration; editor changes require another run.

Editor writes are debounced 350 ms and serialized. Route transitions flush pending edits. A load must not flush an already-saved stale project over a newer import. A failed write remains visible in the save indicator. Project exports omit historical event logs to keep files portable.

## Routes

`/`, `/demo`, `/project/:projectId`, `/project/:projectId/compare`, `/project/:projectId/import`, `/how-it-works`, `/about`.

## Rendering and performance

XYFlow provides graph interaction, not simulation. The engine calculates the entire run before visual playback. requestAnimationFrame advances an independent playback clock; 1× represents 6 simulation seconds per real second. Max seeks to the run's end. Recorded visits provide queue and service state. Decorative connection motion is triggered by recorded task arrival activity and has no physical travel-time meaning.

The supported workflow target is 1,000 customers and 20 stations; the engine test exercises that case. An explicit 10,000-arrival cap prevents accidental runaway simulations. Larger configurations can block the main thread; a Web Worker is a future extension, not silently claimed as implemented.

## Trust and privacy

No backend or external data processing. Import data is treated as data, never executed. Zod validates JSON shape, bounds, and schema version; workflow validation runs before simulation. CSV size and arrival count are bounded. No credentials are required. Fonts are packaged locally.
