import { Link } from "react-router-dom";
import {
  ArrowRight,
  GitBranch,
  Layers,
  Shuffle,
  ShieldCheck,
  Activity,
  Clock,
} from "lucide-react";
import { MiniFlow } from "../components/Common";
export function Info({ about = false }: { about?: boolean }) {
  return (
    <main className="page info-page">
      <div className="eyebrow">
        {about ? "PURPOSE, PRIVACY & LIMITATIONS" : "INSIDE THE SIMULATION"}
      </div>
      <h1>
        {about
          ? "A small lab for real-world operations."
          : "A real engine. Not just an animation."}
      </h1>
      <p className="intro">
        {about
          ? "RushTwin helps small service businesses and queue-based operations test changes before a real rush."
          : "Every queue, waiting customer, and completed order comes from a discrete-event simulation written specifically for RushTwin."}
      </p>
      <section className="surface info-flow">
        <MiniFlow large />
      </section>
      {about ? (
        <>
          <section className="surface">
            <ShieldCheck />
            <h2>Your data stays with you.</h2>
            <p>
              Projects, scenarios, imported arrivals, and simulation runs are
              stored locally in this browser using IndexedDB. RushTwin does not
              send customer data to a server, use analytics, or require an
              account. Clearing browser storage removes saved work. Export
              projects for a portable backup.
            </p>
          </section>
          <section className="surface">
            <h2>Understand the assumptions.</h2>
            <p>
              RushTwin is a simulation tool. Its results depend on the workflow,
              timing, demand, and assumptions entered by the user. Results
              estimate what may happen under those conditions and are not
              guaranteed predictions of real-world performance.
            </p>
            <p>
              This version models acyclic workflows, independent service
              durations, fixed worker allocations, unbounded FIFO queues, and
              parallel task joins. It does not model worker breaks, abandonment,
              shared worker pools, inventory, or physical travel time. Queue
              delay is summed across parallel tasks, so it may exceed elapsed
              customer time.
            </p>
          </section>
          <section className="surface">
            <h2>Built for transparent experiments.</h2>
            <p>
              Version 1.0 · React, TypeScript, Vite, Tailwind, XYFlow, Zustand,
              Dexie, Recharts, Papa Parse, and Zod. The event heap, random
              generator, dependency resolution, service processing, replay, and
              metrics are custom application logic.
            </p>
            <p>
              Developed with AI assistance. Student authorship, understanding,
              testing, and competition disclosures should be reviewed and
              completed by the student; no personal story or eligibility claim
              is fabricated.
            </p>
          </section>
        </>
      ) : (
        <>
          <section className="surface">
            <Activity />
            <h2>01 / Jump to the next event</h2>
            <p>
              A customer arrives. A task becomes ready. A worker finishes a
              service. These events are stored in a binary min-heap ordered by
              simulation time, then insertion sequence. The clock jumps directly
              to the next event instead of advancing every millisecond.
            </p>
            <div className="process-flow">
              Arrival <ArrowRight /> Event queue <ArrowRight /> FIFO queue{" "}
              <ArrowRight /> Service <ArrowRight /> Next task <ArrowRight />{" "}
              Complete
            </div>
            <p>
              Heap insertion and removal take O(log n). Playback reads the
              completed event history; browser frame rate never changes the
              answer.
            </p>
          </section>
          <section className="surface">
            <GitBranch />
            <h2>02 / One order, parallel tasks</h2>
            <p>
              Each order type selects required stations. Workflow edges form a
              dependency graph. When Order finishes, Drinks and Food can start
              independently, each subject to worker capacity. Pickup waits for
              both required branches to finish. Drink-only orders skip Food.
            </p>
            <p>
              If Drinks takes 2 seconds and Food takes 4, Pickup starts at
              second 4. Each station has a FIFO queue and can process one task
              per assigned worker concurrently.
            </p>
          </section>
          <section className="surface">
            <Shuffle />
            <h2>03 / Same rush. Fair comparison.</h2>
            <p>
              A RunDemand object records every customer ID, arrival time, and
              order type. Replay reuses it exactly. A Mulberry32 random
              generator samples service time from a sub-seed derived from the
              demand seed, customer ID, and station ID. A different worker
              allocation preserves each customer's service requirements.
            </p>
            <p>
              Generated arrivals follow a Poisson process. Rush schedules use
              independent exponential arrivals inside each interval. Fixed,
              uniform, normal, and symmetric triangular service distributions
              are supported. Normal samples clamp to 0.001 seconds.
            </p>
          </section>
          <section className="surface">
            <Clock />
            <h2>04 / Measure time, not screenshots</h2>
            <p>
              Average queue length integrates queue length over time and divides
              by the full run duration. Utilization divides total busy worker
              seconds by workers × duration. Throughput counts completed
              customers per hour including drain time. P90 uses linear
              interpolation at (n − 1) × 0.9.
            </p>
            <p>
              Completed-customer wait sums queue time across their tasks.
              Unfinished customers are reported separately. Busy-time effort and
              parallel waits are not additive to elapsed customer time.
            </p>
          </section>
          <section className="surface">
            <Layers />
            <h2>05 / Find the constraint with evidence</h2>
            <p>
              The primary bottleneck is the station with the greatest
              accumulated queue delay (queue area). Utilization, time-weighted
              average queue, maximum queue, station wait, and share of total
              delay show why. A zero-worker station can become the bottleneck
              even though its utilization is zero.
            </p>
            <p>
              During playback, a queue of at least three tasks is marked as a
              candidate bottleneck. Final rankings use the complete run. There
              is no AI recommendation or hidden “optimization score.”
            </p>
          </section>
        </>
      )}
      <Link className="button primary" to="/demo">
        Try the café experiment
        <ArrowRight size={16} />
      </Link>
    </main>
  );
}
