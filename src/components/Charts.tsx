import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import type { Run } from "../types/model";
import { queueSeries, playbackState } from "../simulation/playback";
import { clock } from "../utils/format";
const colors = ["#3157e8", "#d99b24", "#16875d", "#9c63ce", "#c43d3d"];
export function QueueChart({ run, other }: { run: Run; other?: Run }) {
  const data = useMemo(() => {
    const a = queueSeries(run);
    if (!other) return a;
    const id = run.bottleneck ?? run.stations[0]?.id;
    const end = Math.max(run.summary.duration, other.summary.duration);
    return Array.from({ length: 91 }, (_, i) => {
      const time = (end * i) / 90;
      return {
        time,
        baseline: playbackState(run, time).stations[id]?.queue.length ?? 0,
        comparison: playbackState(other, time).stations[id]?.queue.length ?? 0,
      };
    });
  }, [run, other]);
  return (
    <div
      className="chart"
      role="img"
      aria-label={
        other
          ? "Queue length comparison at equal simulation timestamps"
          : "Queue length over time, sampled from recorded customer visits"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#edf0f4" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={clock}
            minTickGap={50}
            tick={{ fontSize: 11 }}
          />
          <YAxis allowDecimals={false} width={30} tick={{ fontSize: 11 }} />
          <Tooltip labelFormatter={(v) => clock(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {other ? (
            <>
              <Line
                type="stepAfter"
                dataKey="baseline"
                name="Baseline queue"
                stroke={colors[0]}
                dot={false}
              />
              <Line
                type="stepAfter"
                dataKey="comparison"
                name="Comparison queue"
                stroke={colors[2]}
                dot={false}
              />
            </>
          ) : (
            run.stations.map((s, i) => (
              <Line
                key={s.id}
                type="stepAfter"
                dataKey={s.id}
                name={s.name}
                stroke={colors[i % colors.length]}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export function WaitChart({ run }: { run: Run }) {
  return (
    <div
      className="chart"
      role="img"
      aria-label="Average queue wait by station in seconds"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={run.stations}>
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={70}
            tick={{ fontSize: 11 }}
          />
          <Tooltip />
          <Bar
            dataKey="avgWait"
            name="Average wait (seconds)"
            fill="#3157e8"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
