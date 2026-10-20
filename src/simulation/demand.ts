import type { RunDemand, Scenario } from "../types/model";
import { SeededRandom, subSeed } from "./random";
export function generateDemand(s: Scenario): RunDemand {
  if (s.demand.mode === "imported" && s.replay)
    return structuredClone(s.replay);
  const r = new SeededRandom(subSeed(s.demand.seed, "arrivals"));
  const types = new SeededRandom(subSeed(s.demand.seed, "types"));
  const intervals =
    s.demand.mode === "schedule"
      ? s.demand.intervals
      : [{ start: 0, end: s.demand.duration, rate: s.demand.rate }];
  const arrivals: RunDemand["arrivals"] = [];
  for (const interval of intervals) {
    if (interval.rate <= 0) continue;
    let time = interval.start;
    while (true) {
      time += -Math.log(1 - r.next()) / (interval.rate / 3600);
      if (time >= interval.end) break;
      if (arrivals.length >= 10000)
        throw new Error(
          "Demand exceeds 10,000 customers. Reduce arrival rate or duration.",
        );
      arrivals.push({
        id: String(arrivals.length + 1).padStart(3, "0"),
        time,
        type: s.orderTypes[
          types.choiceWeighted(s.orderTypes.map((t) => t.weight))
        ].id,
      });
    }
  }
  return { seed: s.demand.seed, duration: s.demand.duration, arrivals };
}
