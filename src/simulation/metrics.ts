import type { CustomerResult, StationResult, Summary } from "../types/model";
export const average = (v: number[]) =>
  v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
// Linear interpolation at index (n-1)*p (Hyndman-Fan type 7).
export function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const v = [...values].sort((a, b) => a - b),
    index = (v.length - 1) * p,
    lo = Math.floor(index);
  return v[lo] + (v[Math.ceil(index)] - v[lo]) * (index - lo);
}
export function summarize(
  customers: CustomerResult[],
  stations: StationResult[],
  duration: number,
): Summary {
  const finished = customers.filter((c) => c.completed !== undefined),
    waits = finished.map((c) => c.wait);
  return {
    arrivals: customers.length,
    completed: finished.length,
    unfinished: customers.length - finished.length,
    duration,
    throughput: duration ? (finished.length * 3600) / duration : 0,
    avgWait: average(waits),
    medianWait: percentile(waits, 0.5),
    p90Wait: percentile(waits, 0.9),
    maxWait: Math.max(0, ...waits),
    avgService: average(finished.map((c) => c.service)),
    avgTotal: average(finished.map((c) => c.total)),
    maxQueue: Math.max(0, ...stations.map((s) => s.maxQueue)),
  };
}
