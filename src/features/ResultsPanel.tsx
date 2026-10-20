import { useMemo, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import type { Run, Scenario, StationResult } from "../types/model";
import { usePlayback } from "../stores/playback";
import { playbackState, queueSeries } from "../simulation/playback";
import { clock, duration, percent, download } from "../utils/format";
import { Metric } from "../components/Common";
import { QueueChart, WaitChart } from "../components/Charts";
export function ResultsPanel({
  scenario,
  run,
  onCustomer,
}: {
  scenario: Scenario;
  run: Run | null;
  onCustomer: (id: string) => void;
}) {
  const { time, playing, speed, tab, toggle, seek, setSpeed, setTab } =
    usePlayback();
  const [expanded, setExpanded] = useState(false),
    [filter, setFilter] = useState("All"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState<keyof StationResult>("totalWait");
  const state = useMemo(
    () => (run ? playbackState(run, time) : null),
    [run, time],
  );
  const series = useMemo(() => (run ? queueSeries(run, 30) : []), [run]);
  if (!run)
    return (
      <div className="ready-panel">
        <span className="ready-mark">
          <Play size={20} />
        </span>
        <div>
          <h3>Ready to simulate</h3>
          <p>
            {scenario.stations.filter((n) => n.kind === "station").length}{" "}
            processing stations · {scenario.demand.duration / 60} minutes · Seed{" "}
            {scenario.demand.seed}
          </p>
        </div>
        <span className="badge blue">YOUR NEXT EXPERIMENT STARTS HERE</span>
      </div>
    );
  const bottleneck = run.stations.find((s) => s.id === run.bottleneck);
  const logs = run.events.filter(
    (e) =>
      e.time <= time &&
      e.customerId.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "All" || e.type.includes(filter)),
  );
  return (
    <section className={`results-panel ${expanded ? "expanded" : ""}`}>
      <div className="result-tabs">
        {["Live", "Results", "Timeline", "Event Log", "Customers"].map((t) => (
          <button
            key={t}
            className={t === tab ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
        <span className="result-run-name">
          {run.scenario.name} · seed {run.seed}
        </span>
        <button
          className="icon-button"
          aria-label={expanded ? "Collapse results" : "Expand results"}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
        </button>
      </div>
      <div className="result-scroll">
        {tab === "Live" && (
          <>
            <div className="metrics-strip">
              <Metric label="Simulation time" value={clock(time)} />
              <Metric
                label="Customers"
                value={`${state?.arrived} / ${run.summary.arrivals}`}
              />
              <Metric label="Completed" value={state?.completed ?? 0} />
              <Metric
                label="Queue delay / arrival"
                value={duration(state?.avgWait ?? 0)}
              />
              <Metric
                label="Throughput"
                value={`${time ? (((state?.completed ?? 0) * 3600) / time).toFixed(0) : 0}/hr`}
              />
              <Metric
                label="Bottleneck"
                value={
                  run.stations.find((s) => s.id === state?.bottleneck)?.name ??
                  "None yet"
                }
              />
            </div>
            <p className="panel-note">
              Playback is 6 simulated seconds per real second at 1×. Results are
              independent of playback speed.
            </p>
          </>
        )}
        {tab === "Results" && (
          <>
            <div className="metrics-strip">
              <Metric
                label="Completed orders"
                value={`${run.summary.completed} / ${run.summary.arrivals}`}
                note={`${run.summary.unfinished} unfinished`}
              />
              <Metric
                label="Average queue wait"
                value={duration(run.summary.avgWait)}
              />
              <Metric label="P90 wait" value={duration(run.summary.p90Wait)} />
              <Metric
                label="Throughput"
                value={`${run.summary.throughput.toFixed(1)}/hr`}
              />
              <Metric
                label="Primary bottleneck"
                value={bottleneck?.name ?? "None"}
              />
            </div>
            <p className="panel-note">
              Customer wait statistics include completed customers and sum queue
              delay across parallel tasks. Throughput uses the full run,
              including drain time ({duration(run.summary.duration)}).
            </p>
            {bottleneck && (
              <div className="bottleneck-evidence">
                <span className="badge danger">PRIMARY BOTTLENECK</span>
                <b>{bottleneck.name}</b>
                <span>{percent(bottleneck.utilization)} utilization</span>
                <span>{bottleneck.avgQueue.toFixed(1)} average queue</span>
                <span>{percent(bottleneck.waitShare)} of queue delay</span>
              </div>
            )}
            <table>
              <thead>
                <tr>
                  {[
                    ["name", "Station"],
                    ["workers", "Workers"],
                    ["utilization", "Utilization"],
                    ["avgQueue", "Avg queue"],
                    ["maxQueue", "Max queue"],
                    ["avgWait", "Avg wait"],
                    ["processed", "Processed"],
                  ].map(([key, label]) => (
                    <th key={key}>
                      <button
                        onClick={() => setSort(key as keyof StationResult)}
                      >
                        {label}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...run.stations]
                  .sort((a, b) =>
                    typeof a[sort] === "number"
                      ? Number(b[sort]) - Number(a[sort])
                      : String(a[sort]).localeCompare(String(b[sort])),
                  )
                  .map((s) => (
                    <tr
                      className={s.id === run.bottleneck ? "highlight-row" : ""}
                      key={s.id}
                    >
                      <td>{s.name}</td>
                      <td>{s.workers}</td>
                      <td>{percent(s.utilization)}</td>
                      <td>{s.avgQueue.toFixed(2)}</td>
                      <td>{s.maxQueue}</td>
                      <td>{duration(s.avgWait)}</td>
                      <td>{s.processed}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="charts-grid">
              <div>
                <h3>Queue length over time</h3>
                <QueueChart run={run} />
              </div>
              <div>
                <h3>Average wait by station (seconds)</h3>
                <WaitChart run={run} />
              </div>
            </div>
          </>
        )}
        {tab === "Timeline" && (
          <div className="heatmap">
            <h3>When did the queues build?</h3>
            <p>
              Each cell shows the queue at that point in the run. Hover or focus
              for counts.
            </p>
            {run.stations.map((s) => (
              <div className="heatmap-row" key={s.id}>
                <b>{s.name}</b>
                {series.map((v, i) => (
                  <span
                    key={i}
                    tabIndex={0}
                    title={`${clock(v.time)} · ${s.name}: ${v[s.id]} queued`}
                    aria-label={`${clock(v.time)}: ${v[s.id]} queued`}
                    style={{
                      background: `rgba(49,87,232,${Math.min(0.9, 0.05 + Number(v[s.id]) * 0.07)})`,
                    }}
                  >
                    {v[s.id] ? v[s.id] : ""}
                  </span>
                ))}
              </div>
            ))}
            <div className="heatmap-times">
              <span>{clock(0)}</span>
              <span>{clock(run.summary.duration / 2)}</span>
              <span>{clock(run.summary.duration)}</span>
            </div>
          </div>
        )}
        {tab === "Event Log" && (
          <>
            <div className="log-controls">
              <label>
                Filter
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {["All", "ARRIVAL", "QUEUE", "SERVICE", "COMPLETE"].map(
                    (f) => (
                      <option key={f}>{f}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Customer ID
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ID…"
                />
              </label>
              <span>{logs.length} events · latest 200 shown</span>
            </div>
            <div className="event-log">
              {logs.slice(-200).map((e) => (
                <button
                  key={e.sequence}
                  onClick={() => onCustomer(e.customerId)}
                >
                  <time>{clock(e.time)}</time>
                  <b>#{e.customerId}</b>
                  <span>{e.type.toLowerCase().replaceAll("_", " ")}</span>
                  <span>
                    {run.stations.find((s) => s.id === e.stationId)?.name}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        {tab === "Customers" && (
          <>
            <div className="log-controls">
              <label>
                Customer ID
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <button
                onClick={() =>
                  download(
                    "customer-results.csv",
                    "id,arrival,completed,queue_wait,service_effort,total_time\n" +
                      run.customers
                        .map((c) =>
                          [
                            c.id,
                            c.time,
                            c.completed ?? "",
                            c.wait,
                            c.service,
                            c.total,
                          ].join(","),
                        )
                        .join("\n"),
                    "text/csv",
                  )
                }
              >
                <Download size={15} />
                Export results
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Type</th>
                  <th>Arrival</th>
                  <th>Completed</th>
                  <th>Queue wait</th>
                  <th>Total time</th>
                </tr>
              </thead>
              <tbody>
                {run.customers
                  .filter((c) => c.id.includes(search))
                  .slice(0, 500)
                  .map((c) => (
                    <tr key={c.id}>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => onCustomer(c.id)}
                        >
                          #{c.id}
                        </button>
                      </td>
                      <td>
                        {scenario.orderTypes.find((t) => t.id === c.type)?.name}
                      </td>
                      <td>{clock(c.time)}</td>
                      <td>
                        {c.completed !== undefined
                          ? clock(c.completed)
                          : "Unfinished"}
                      </td>
                      <td>{duration(c.wait)}</td>
                      <td>{duration(c.total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <small>Up to 500 shown. Export includes every customer.</small>
          </>
        )}
      </div>
      <div className="playback-controls">
        <button
          className="icon-button"
          aria-label="Restart playback"
          onClick={() => seek(0)}
        >
          <RotateCcw size={16} />
        </button>
        <button
          className="play-button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => {
            if (time >= run.summary.duration) seek(0);
            toggle();
          }}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <select
          aria-label="Playback speed"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          {[1, 2, 5, 10].map((n) => (
            <option value={n} key={n}>
              {n}×
            </option>
          ))}
          <option value={0}>Max</option>
        </select>
        <span>{clock(time)}</span>
        <input
          aria-label="Simulation timeline"
          type="range"
          min="0"
          max={run.summary.duration}
          step="1"
          value={time}
          onChange={(e) => seek(Number(e.target.value))}
        />
        <span>{clock(run.summary.duration)}</span>
      </div>
    </section>
  );
}
