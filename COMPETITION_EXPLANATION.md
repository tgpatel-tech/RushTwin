# Congressional App Challenge explanation guide

RushTwin models a practical problem: a team can look adequately staffed overall while one station accumulates most of the waiting. Changing where a worker is assigned can matter as much as adding staff.

The application uses discrete-event simulation: an event heap selects the next arrival or service completion. The binary heap keeps the smallest `(time, sequence)` at the root and restores ordering after insertion/removal in logarithmic time. FIFO queues track waiting tasks; worker counts cap simultaneous services. Seeded service distributions model variation.

A fixed RunDemand preserves customer identities, arrival times, types, and the seed. Customer/station sub-seeds preserve service characteristics across staffing changes. Dependency tracking lets Drink and Food proceed independently while Pickup waits for both. Time-weighted queue area integrates queue length, and utilization divides busy effort by available worker time. Bottlenecks are explained using measured delay and capacity evidence rather than an invented score.

## Demonstration

Open `/demo`, run the baseline, watch Drinks queue, pause and inspect a customer, finish the run, apply the staffing experiment, replay, and compare. Show the unchanged total workers and same-demand statement. Explain any deterioration, such as increased Order waiting, alongside the improvement.

## What was custom-built

Event heap, FIFO structure, seeded random generator, distribution sampling, arrival generation, dependency contraction, service/capacity logic, replay, metrics, playback reconstruction, and bottleneck ranking.

## Supporting libraries

React/TypeScript/Vite/Tailwind for the app; XYFlow for the graph; Zustand for state; Dexie for IndexedDB; Recharts for charts; Papa Parse for CSV; Zod for schema validation; Lucide for icons; Vitest/Testing Library/Playwright for tests. No existing discrete-event simulation library is used.

See SIMULATION_ENGINE.md for formulas and ARCHITECTURE.md for implementation boundaries. Review every system personally before presenting it. AI assistance must be disclosed according to the applicable competition rules; this repository does not make an eligibility determination.

## MY PERSONAL INSPIRATION

[Student: add your own true experience and motivation.]

## WHAT I LEARNED

[Student: explain what you personally learned and can demonstrate.]

## HARDEST TECHNICAL CHALLENGE

[Student: describe a challenge you personally investigated and resolved.]

## WHAT I WOULD ADD IN VERSION 2

[Student: choose future improvements and explain the tradeoffs.]
