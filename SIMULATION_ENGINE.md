# Simulation engine

## Event ordering

Time is numeric seconds. Events are ordered by `(time, sequence)` in a custom binary min-heap. The sequence increases on insertion. Equal-time events therefore have stable, deterministic ordering. Arrival, task-ready, queue-enter, service-start, service-complete, task-complete, and customer-complete events are retained for inspection.

The clock jumps from event to event. There is no fixed millisecond simulation loop. All completion events drain after the demand horizon; the measured duration is `max(demand horizon, last processed event)`. With zero capacity, queued tasks remain unfinished when there are no more events.

## Capacity and FIFO

Each processing station has a fixed integer worker count. Every available worker takes the oldest ready task. Starting work reserves capacity immediately and schedules a service-complete event. Completion frees capacity and dispatches the next queued task at the same timestamp. The queue uses an array plus head pointer, compacting amortized rather than repeatedly shifting.

## Routing and joins

Each order type selects processing stations. For each selected task, reverse graph traversal finds its nearest selected predecessors, contracting omitted stations. A task becomes eligible only when all selected predecessors complete. DAG validation rejects cycles. Split branches are independent; their common successor waits for both. A drink-only order omits Food without waiting for nonexistent work.

Workflows have exactly one entry and one completion node. All stations must be reachable from entry and have a path to exit. Zero workers is a warning and produces honest unfinished counts, not an exception or fabricated completion.

## Randomness

Mulberry32 supplies strictly interior uniform variates. Exponential interarrival samples use `-ln(1-u)/(rate/3600)`. Each rush interval starts its own independent Poisson process, preserving a piecewise constant rate; gaps have zero demand. Arrival generation and order-type selection have separate deterministic sub-seeds.

Service samples use a sub-seed derived from the fixed demand seed and `customerID:stationID`. Worker changes do not consume randomness in a different global order. Changing service parameters intentionally transforms the same underlying random characteristic.

- Fixed: the specified mean.
- Uniform: `max(0.001, mean - variation)` through `mean + variation`.
- Normal: Box–Muller, standard deviation = variation; clamp at 0.001 seconds.
- Triangular: symmetric centered mode with the same minimum/maximum endpoints as uniform (the lower endpoint clips at 0.001).

Clipped distributions can have an actual mean different from the user-specified center; use positive timing values well above variation for realistic modeling.

## Replay

RunDemand includes seed, horizon, customer IDs, exact arrival timestamps, and order types. Replay clones this object rather than regenerating arrivals. The comparison page checks equality of the complete demand object before labeling a comparison as same-rush. Result IDs and wall-clock creation metadata are intentionally unique; event traces and numerical outputs repeat.

## Metrics

- Queue area: on queue changes, accumulate `previous length × elapsed time`; add the tail to the full run duration. Immediate work has zero waiting area.
- Average queue = queue area / full run duration.
- Busy worker time = sum of service durations.
- Utilization = busy worker time / (workers × full run duration); zero for zero workers.
- Station average/median/P90 wait summarize tasks that started service. Queue area and delay share also include unfinished queued tasks.
- Customer queue wait = sum of station queue delays. For parallel tasks this is **effort-style cumulative delay**, not the union of waiting intervals; it can exceed elapsed customer time.
- Customer processing effort = sum of task service durations, also overlapping on parallel branches.
- Elapsed system time = completion time − arrival time.
- Customer wait/processing/system summary statistics include completed customers only. Unfinished counts are always separate.
- Throughput = completed customers × 3600 / full duration, including drain time.
- Percentiles use linear interpolation at `(n−1)×p`, with empty samples returning zero (Hyndman–Fan type 7).
- Maximum queue is the greatest waiting population after immediate worker assignment; transient arrival-to-start events do not inflate it.
- Primary bottleneck = largest queue area (total accumulated delay), ties by utilization. No queue delay means no bottleneck. Evidence includes utilization, average/max queue, station wait, and delay share. Live candidate badges require at least three queued tasks.

Queue charts sample recorded visits for rendering; all reported time-weighted metrics use exact event timings, never chart samples. Comparison curves use equal absolute simulation times.

## Required examples

One worker, two-second fixed service, arrivals 0/1/2: starts 0/2/4, finishes 2/4/6, waits 0/1/2, average wait 1. With a six-second horizon utilization is 100%, queue area is 3 worker-seconds, average queue is 0.5, and throughput is 1,800/hour.

Parallel tasks at t=0: Food 4 seconds, Drink 2 seconds. Pickup starts at t=4, never at t=2.
