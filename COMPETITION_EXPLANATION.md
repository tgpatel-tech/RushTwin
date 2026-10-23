# RushTwin: project explanation

**Live app:** https://tgpatel-tech.github.io/RushTwin/
**Demo:** https://tgpatel-tech.github.io/RushTwin/#/demo

## The problem

A service business can have several people working and still get backed up at one station. Changing worker allocation during a rush is difficult to test fairly because the next rush may have different customers and different arrival times.

RushTwin makes that experiment repeatable. It models the workflow, records the demand, and replays it under a different setup.

## The demo

The café starts with five workers: two at Order and one each at Drinks, Food, and Pickup. Customers place orders, Drinks and Food can run in parallel, and Pickup waits for the required preparation tasks.

The experiment moves one worker from Order to Drinks. The number of workers stays at five. Both scenarios use the same arrival times, order types, and customer-specific service randomness. The comparison shows what improved, what worsened, and where the bottleneck moved.

## What happens under the interface

1. Generated arrivals follow a seeded Poisson process, or an imported CSV supplies a fixed arrival schedule.
2. A binary min-heap selects the next event by time, then insertion order. The simulation jumps to that event instead of stepping through every millisecond.
3. Tasks join FIFO queues. Each worker handles one service at a time.
4. Dependency tracking allows independent branches and makes joins wait for all required tasks.
5. Recorded task times produce the metrics and the playback state. Browser frame rate cannot change the simulation result.

## Why replay is fair

A `RunDemand` record preserves each customer ID, arrival time, order type, and the seed. Service randomness is derived from the seed plus customer and station IDs. Changing staffing therefore changes when work happens without randomly changing how much work that same customer needs at the same station.

## How the measurements work

- **Average queue:** integrate queue length over time, then divide by the run duration.
- **Utilization:** divide busy worker seconds by worker count × run duration.
- **Throughput:** completed customers per hour, including time to finish remaining work after arrivals stop.
- **P90 wait:** a deterministic, interpolated percentile of completed-customer queue delay.
- **Bottleneck:** the station with the largest accumulated queue delay, supported by queue and utilization evidence.

Parallel tasks can overlap. Summed queue delay and processing effort are not the same as elapsed time in the system. The app and [engine documentation](SIMULATION_ENGINE.md) explain this distinction.

## Application-specific code and supporting libraries

The event heap, FIFO queue, random generator, distributions, routing, capacity model, replay, playback reconstruction, and metrics are application-specific code. React and XYFlow provide the interface; Recharts provides charts; Dexie provides browser storage; Papa Parse and Zod support import and validation.

OpenAI Codex contributed substantially to implementation and testing. See [AI usage](AI_USAGE.md) for the disclosure. Describing the algorithms here is not a claim of unaided authorship or proof of personal understanding.

## Personal explanation

The personal story, learning examples, and exact contribution record belong in the [submission worksheet](docs/SUBMISSION_WORKSHEET.md). They have not been invented for this guide.
