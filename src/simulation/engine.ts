import type {
  CustomerResult,
  Run,
  RunDemand,
  Scenario,
  SimEvent,
  StationResult,
  Visit,
} from "../types/model";
import { EventQueue, Fifo } from "./queue";
import { sample, SeededRandom, subSeed } from "./random";
import { dependencies, validateWorkflow } from "./validation";
import { generateDemand } from "./demand";
import { average, percentile, summarize } from "./metrics";
type Task = { customer: CustomerResult; visit: Visit };
export function simulate(
  s: Scenario,
  provided?: RunDemand,
  projectId = "",
): Run {
  const validation = validateWorkflow(s);
  if (validation.errors.length) throw new Error(validation.errors.join("\n"));
  const demand = structuredClone(provided ?? generateDemand(s));
  if (
    demand.arrivals.length > 10000 ||
    !Number.isFinite(demand.duration) ||
    demand.duration <= 0
  )
    throw new Error("Invalid demand duration or more than 10,000 arrivals.");
  const unique = new Set<string>();
  for (const a of demand.arrivals) {
    if (
      unique.has(a.id) ||
      !Number.isFinite(a.time) ||
      a.time < 0 ||
      a.time > demand.duration ||
      !s.orderTypes.some((t) => t.id === a.type)
    )
      throw new Error(
        "Replay has duplicate IDs, invalid times, or unavailable order types.",
      );
    unique.add(a.id);
  }
  const queue = new EventQueue<SimEvent>(),
    events: SimEvent[] = [];
  let sequence = 0,
    time = 0;
  const schedule = (
    type: SimEvent["type"],
    at: number,
    customerId: string,
    stationId?: string,
  ) =>
    queue.push({ type, time: at, customerId, stationId, sequence: sequence++ });
  const customers = demand.arrivals.map(
    (a) =>
      ({ ...a, visits: [], wait: 0, service: 0, total: 0 }) as CustomerResult,
  );
  const byId = new Map(customers.map((c) => [c.id, c]));
  const plans = new Map(
    s.orderTypes.map((t) => [t.id, dependencies(s, t.stations)]),
  );
  const states = new Map(
    s.stations
      .filter((n) => n.kind === "station")
      .map((n) => [
        n.id,
        {
          node: n,
          queue: new Fifo<Task>(),
          busy: 0,
          last: 0,
          area: 0,
          max: 0,
          busyTime: 0,
          processed: 0,
          waits: [] as number[],
        },
      ]),
  );
  const update = (id: string) => {
    const st = states.get(id)!;
    st.area += st.queue.size * (time - st.last);
    st.last = time;
  };
  function dispatch(id: string) {
    const st = states.get(id)!;
    while (st.busy < st.node.workers && st.queue.size) {
      update(id);
      const task = st.queue.pop()!;
      st.busy++;
      task.visit.start = time;
      task.visit.duration = sample(
        st.node.service,
        new SeededRandom(subSeed(demand.seed, `${task.customer.id}:${id}`)),
      );
      st.waits.push(time - task.visit.queued);
      st.busyTime += task.visit.duration;
      schedule("SERVICE_START", time, task.customer.id, id);
      schedule(
        "SERVICE_COMPLETE",
        time + task.visit.duration,
        task.customer.id,
        id,
      );
    }
  }
  function ready(c: CustomerResult) {
    const plan = plans.get(c.type)!;
    for (const [id, deps] of Object.entries(plan)) {
      if (c.visits.some((v) => v.stationId === id)) continue;
      if (
        deps.every((dep) =>
          c.visits.some((v) => v.stationId === dep && v.end !== undefined),
        )
      ) {
        c.visits.push({ stationId: id, queued: time });
        schedule("TASK_READY", time, c.id, id);
      }
    }
    if (
      Object.keys(plan).length ===
        c.visits.filter((v) => v.end !== undefined).length &&
      c.completed === undefined
    ) {
      c.completed = time;
      schedule("CUSTOMER_COMPLETE", time, c.id);
    }
  }
  customers.forEach((c) => schedule("CUSTOMER_ARRIVAL", c.time, c.id));
  while (queue.size) {
    const e = queue.pop()!;
    time = e.time;
    events.push(e);
    const c = byId.get(e.customerId)!;
    switch (e.type) {
      case "CUSTOMER_ARRIVAL":
        ready(c);
        break;
      case "TASK_READY":
        schedule("QUEUE_ENTER", time, c.id, e.stationId);
        break;
      case "QUEUE_ENTER": {
        const st = states.get(e.stationId!)!;
        update(e.stationId!);
        st.queue.push({
          customer: c,
          visit: c.visits.find((v) => v.stationId === e.stationId)!,
        });
        dispatch(e.stationId!);
        st.max = Math.max(st.max, st.queue.size);
        break;
      }
      case "SERVICE_COMPLETE": {
        const st = states.get(e.stationId!)!;
        const v = c.visits.find((v) => v.stationId === e.stationId)!;
        v.end = time;
        st.busy--;
        st.processed++;
        schedule("TASK_COMPLETE", time, c.id, e.stationId);
        dispatch(e.stationId!);
        ready(c);
        break;
      }
    }
  }
  const duration = Math.max(demand.duration, time);
  for (const c of customers) {
    c.wait = c.visits.reduce(
      (sum, v) => sum + (v.start ?? duration) - v.queued,
      0,
    );
    c.service = c.visits.reduce((sum, v) => sum + (v.duration ?? 0), 0);
    c.total = (c.completed ?? duration) - c.time;
  }
  const stations: StationResult[] = [...states.values()].map((st) => {
    st.area += st.queue.size * (duration - st.last);
    const waits = st.waits;
    return {
      id: st.node.id,
      name: st.node.name,
      workers: st.node.workers,
      processed: st.processed,
      utilization:
        st.node.workers && duration
          ? st.busyTime / (st.node.workers * duration)
          : 0,
      avgQueue: duration ? st.area / duration : 0,
      maxQueue: st.max,
      avgWait: average(waits),
      medianWait: percentile(waits, 0.5),
      p90Wait: percentile(waits, 0.9),
      busyTime: st.busyTime,
      totalWait: st.area,
      waitShare: 0,
    };
  });
  const totalWait = stations.reduce((a, b) => a + b.totalWait, 0);
  stations.forEach(
    (st) => (st.waitShare = totalWait ? st.totalWait / totalWait : 0),
  );
  const bottleneck = [...stations].sort(
    (a, b) => b.totalWait - a.totalWait || b.utilization - a.utilization,
  )[0];
  return {
    id: crypto.randomUUID(),
    projectId,
    scenarioId: s.id,
    scenario: structuredClone(s),
    createdAt: Date.now(),
    seed: demand.seed,
    demand,
    customers,
    stations,
    events,
    summary: summarize(customers, stations, duration),
    bottleneck: bottleneck?.totalWait > 0 ? bottleneck.id : undefined,
  };
}
