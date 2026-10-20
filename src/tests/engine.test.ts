import { describe, it, expect } from "vitest";
import { createScenario } from "../persistence/templates";
import { simulate } from "../simulation/engine";
import { EventQueue, Fifo } from "../simulation/queue";
import { SeededRandom, sample } from "../simulation/random";
import { generateDemand } from "../simulation/demand";
import { percentile } from "../simulation/metrics";
import { validateWorkflow } from "../simulation/validation";
import { playbackState } from "../simulation/playback";
const simple = () => {
  const s = createScenario("Simple Service Line");
  s.stations[1].service = { kind: "fixed", mean: 2, variation: 0 };
  return s;
};
const rush = {
  seed: 1,
  duration: 6,
  arrivals: [0, 1, 2].map((time, i) => ({
    id: String(i),
    time,
    type: "standard",
  })),
};
describe("core discrete events", () => {
  it("orders heap by time and stable sequence", () => {
    const q = new EventQueue<{ time: number; sequence: number }>();
    [3, 1, 2, 0].forEach((sequence) =>
      q.push({ time: sequence === 3 ? 0 : 1, sequence }),
    );
    expect(Array.from({ length: 4 }, () => q.pop()?.sequence)).toEqual([
      3, 0, 1, 2,
    ]);
    expect(q.pop()).toBeUndefined();
  });
  it("FIFO compacts without changing order", () => {
    const q = new Fifo<number>();
    for (let i = 0; i < 3000; i++) q.push(i);
    for (let i = 0; i < 3000; i++) expect(q.pop()).toBe(i);
    expect(q.size).toBe(0);
  });
  it("mandatory 0,1,2 arrivals produce starts 0,2,4 and average wait 1", () => {
    const r = simulate(simple(), rush);
    expect(r.customers.map((c) => c.visits[0].start)).toEqual([0, 2, 4]);
    expect(r.customers.map((c) => c.completed)).toEqual([2, 4, 6]);
    expect(r.summary.avgWait).toBe(1);
    expect(r.stations[0].utilization).toBe(1);
    expect(r.stations[0].avgQueue).toBe(0.5);
    expect(r.summary.p90Wait).toBe(1.8);
    expect(r.summary.throughput).toBe(1800);
  });
  it("multiple workers process concurrently", () => {
    const s = simple();
    s.stations[1].workers = 2;
    const r = simulate(s, rush);
    expect(r.customers.map((c) => c.visits[0].start)).toEqual([0, 1, 2]);
  });
  it("zero workers retain queued unfinished tasks and queue area", () => {
    const s = simple();
    s.stations[1].workers = 0;
    const r = simulate(s, rush);
    expect(r.summary.completed).toBe(0);
    expect(r.summary.unfinished).toBe(3);
    expect(r.stations[0].avgQueue).toBe(2.5);
    expect(r.stations[0].utilization).toBe(0);
  });
  it("parallel food 4s and drink 2s join at 4s", () => {
    const s = createScenario();
    s.stations = s.stations.filter((n) => n.id !== "order");
    s.links = s.links.filter(
      (e) => e.source !== "order" && e.target !== "order",
    );
    s.links.push(
      { id: "ed", source: "entry", target: "drinks" },
      { id: "ef", source: "entry", target: "food" },
    );
    s.orderTypes = s.orderTypes.map((t) => ({
      ...t,
      stations: t.stations.filter((id) => id !== "order"),
    }));
    for (const st of s.stations)
      st.service = {
        kind: "fixed",
        mean: st.id === "food" ? 4 : 2,
        variation: 0,
      };
    const r = simulate(s, {
      seed: 1,
      duration: 10,
      arrivals: [{ id: "a", time: 0, type: "both" }],
    });
    expect(
      r.customers[0].visits.find((v) => v.stationId === "pickup")?.start,
    ).toBe(4);
    expect(r.customers[0].completed).toBe(6);
  });
  it("same demand and service characteristics survive worker changes", () => {
    const s = createScenario();
    const demand = generateDemand(s);
    const a = simulate(s, demand);
    const b = structuredClone(s);
    b.stations.find((n) => n.id === "order")!.workers = 1;
    b.stations.find((n) => n.id === "drinks")!.workers = 2;
    const r = simulate(b, a.demand);
    expect(r.demand).toEqual(a.demand);
    expect(r.seed).toBe(a.seed);
    expect(
      r.customers.map((c) =>
        c.visits.map((v) => [v.stationId, v.duration]).sort(),
      ),
    ).toEqual(
      a.customers.map((c) =>
        c.visits.map((v) => [v.stationId, v.duration]).sort(),
      ),
    );
    expect(a.bottleneck).toBe("drinks");
    expect(playbackState(a,2400).bottleneck).toBe("drinks");
    expect(r.summary.avgWait).toBeLessThan(a.summary.avgWait);
    console.info("Café validation", {
      customers: a.summary.arrivals,
      baselineWait: a.summary.avgWait,
      reallocatedWait: r.summary.avgWait,
    });
  });
  it("repeated runs are mathematically identical", () => {
    const a = simulate(simple(), rush),
      b = simulate(simple(), rush);
    expect(a.events).toEqual(b.events);
    expect(a.summary).toEqual(b.summary);
  });
  it("empty demand has finite zero metrics", () => {
    expect(
      simulate(simple(), { seed: 1, duration: 60, arrivals: [] }).summary
        .avgWait,
    ).toBe(0);
  });
  it("playback reflects the recorded state at a chosen timestamp", () => {
    const r = simulate(simple(), rush);
    expect(playbackState(r, 1.5).stations.service.queue).toEqual(["1"]);
    expect(playbackState(r, 6).completed).toBe(3);
  });
  it("validates graph cycles and disconnected stations", () => {
    const s = simple();
    s.links.push({ id: "loop", source: "service", target: "entry" });
    expect(validateWorkflow(s).errors.join()).toContain("cycle");
    s.links = [];
    expect(validateWorkflow(s).errors.join()).toContain("no path");
  });
  it("validates invalid service and order mix", () => {
    const s = simple();
    s.stations[1].service.mean = 0;
    s.orderTypes[0].weight = 50;
    expect(validateWorkflow(s).errors).toHaveLength(2);
  });
  it("handles 1000 customers and 20 stations", () => {
    const s = simple(),
      base = s.stations[1];
    s.stations = [
      s.stations[0],
      ...Array.from({ length: 20 }, (_, i) => ({ ...base, id: `s${i}` })),
      s.stations[2],
    ];
    s.links = s.stations
      .slice(1)
      .map((n, i) => ({ id: `e${i}`, source: s.stations[i].id, target: n.id }));
    s.orderTypes[0].stations = s.stations
      .filter((n) => n.kind === "station")
      .map((n) => n.id);
    const r = simulate(s, {
      seed: 2,
      duration: 2000,
      arrivals: Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        time: i,
        type: "standard",
      })),
    });
    expect(r.summary.completed).toBe(1000);
  });
});
describe("randomness and statistics", () => {
  it("repeats seeded sequences", () => {
    const a = new SeededRandom(42),
      b = new SeededRandom(42);
    expect(Array.from({ length: 100 }, () => a.next())).toEqual(
      Array.from({ length: 100 }, () => b.next()),
    );
  });
  it.each(["fixed", "uniform", "normal", "triangular"] as const)(
    "%s service is finite positive",
    (kind) => {
      const r = new SeededRandom(42),
        values = Array.from({ length: 2000 }, () =>
          sample({ kind, mean: 20, variation: 5 }, r),
        );
      expect(values.every((v) => v > 0 && Number.isFinite(v))).toBe(true);
      if (kind !== "normal")
        expect(values.every((v) => v >= 15 && v <= 25)).toBe(true);
      expect(values.reduce((a, b) => a + b, 0) / values.length).toBeCloseTo(
        20,
        0,
      );
    },
  );
  it("Poisson demand is repeatable and bounded by intervals", () => {
    const s = createScenario();
    expect(generateDemand(s)).toEqual(generateDemand(s));
    expect(
      generateDemand(s).arrivals.every((a) => a.time >= 0 && a.time < 3600),
    ).toBe(true);
  });
  it("interpolates P90 and handles singleton/empty", () => {
    expect(percentile([0, 10], 0.9)).toBe(9);
    expect(percentile([], 0.9)).toBe(0);
    expect(percentile([3], 0.9)).toBe(3);
  });
});
