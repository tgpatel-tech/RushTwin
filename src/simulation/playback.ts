import type { Run } from "../types/model";
export function playbackState(run: Run, time: number) {
  const stations: Record<
    string,
    {
      queue: string[];
      busy: string[];
      processed: number;
      wait: number;
      utilization: number;
    }
  > = {};
  for (const st of run.stations)
    stations[st.id] = {
      queue: [],
      busy: [],
      processed: 0,
      wait: 0,
      utilization: 0,
    };
  let arrived = 0,
    completed = 0,
    totalWait = 0;
  for (const c of run.customers) {
    if (c.time > time) continue;
    arrived++;
    if (c.completed !== undefined && c.completed <= time) completed++;
    for (const v of c.visits) {
      const st = stations[v.stationId];
      if (v.queued > time) continue;
      const wait = Math.max(0, Math.min(time, v.start ?? time) - v.queued);
      totalWait += wait;
      st.wait += wait;
      if (v.start === undefined || v.start > time) st.queue.push(c.id);
      else if (v.end === undefined || v.end > time) st.busy.push(c.id);
      else st.processed++;
      if (v.start !== undefined && time > v.start)
        st.utilization += Math.min(time, v.end ?? time) - v.start;
    }
  }
  for (const st of run.stations)
    stations[st.id].utilization =
      time && st.workers
        ? stations[st.id].utilization / (time * st.workers)
        : 0;
  const bottleneck = Object.entries(stations)
    .filter(([, s]) => s.queue.length >= 3)
    .sort((a, b) => b[1].queue.length - a[1].queue.length)[0]?.[0];
  return {
    stations,
    arrived,
    completed,
    avgWait: arrived ? totalWait / arrived : 0,
    bottleneck,
  };
}
export function queueSeries(run: Run, points = 90): Record<string, number>[] {
  return Array.from({ length: points + 1 }, (_, i) => {
    const time = (run.summary.duration * i) / points,
      state = playbackState(run, time);
    return {
      time,
      ...Object.fromEntries(
        Object.entries(state.stations).map(([id, v]) => [id, v.queue.length]),
      ),
    };
  });
}
