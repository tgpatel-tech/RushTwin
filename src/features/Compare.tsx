import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Equal,
  GitCompareArrows,
} from "lucide-react";
import type { Run } from "../types/model";
import { db } from "../persistence/db";
import { duration } from "../utils/format";
import { QueueChart } from "../components/Charts";
import { Empty } from "../components/Common";
export function Compare() {
  const { projectId } = useParams();
  const [runs, setRuns] = useState<Run[]>([]),
    [left, setLeft] = useState(""),
    [right, setRight] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    void db.runs
      .where("projectId")
      .equals(projectId!)
      .sortBy("createdAt")
      .then((all) => {
        const latest = [...new Map(all.map((r) => [r.scenarioId, r])).values()];
        setRuns(latest);
        setLeft(latest[0]?.id ?? "");
        setRight(latest[1]?.id ?? "");
      })
      .catch(() => setError("Saved runs could not be loaded."));
  }, [projectId]);
  const a = runs.find((r) => r.id === left),
    b = runs.find((r) => r.id === right);
  const same =
    !!a && !!b && JSON.stringify(a.demand) === JSON.stringify(b.demand);
  const rows =
    a && b
      ? [
          {
            label: "Average Wait",
            a: a.summary.avgWait,
            b: b.summary.avgWait,
            format: duration,
            lower: true,
          },
          {
            label: "P90 Wait",
            a: a.summary.p90Wait,
            b: b.summary.p90Wait,
            format: duration,
            lower: true,
          },
          {
            label: "Maximum Queue",
            a: a.summary.maxQueue,
            b: b.summary.maxQueue,
            format: String,
            lower: true,
          },
          {
            label: "Throughput",
            a: a.summary.throughput,
            b: b.summary.throughput,
            format: (v: number) => `${v.toFixed(1)}/hr`,
            lower: false,
          },
          {
            label: "Completed Orders",
            a: a.summary.completed,
            b: b.summary.completed,
            format: String,
            lower: false,
          },
        ]
      : [];
  const changes =
    a && b
      ? [
          ...new Set(
            [...a.scenario.stations, ...b.scenario.stations].map((s) => s.id),
          ),
        ].flatMap((id) => {
          const x = a.scenario.stations.find((s) => s.id === id),
            y = b.scenario.stations.find((s) => s.id === id);
          if (!x || !y)
            return [
              {
                name: x?.name ?? y!.name,
                label: x ? "Removed" : "Added",
                before: x?.name ?? "—",
                after: y?.name ?? "—",
              },
            ];
          const result: {
            name: string;
            label: string;
            before: string;
            after: string;
          }[] = [];
          if (x.workers !== y.workers)
            result.push({
              name: y.name,
              label: "Workers",
              before: String(x.workers),
              after: String(y.workers),
            });
          if (JSON.stringify(x.service) !== JSON.stringify(y.service))
            result.push({
              name: y.name,
              label: "Service",
              before: `${x.service.kind} ${x.service.mean} ± ${x.service.variation}s`,
              after: `${y.service.kind} ${y.service.mean} ± ${y.service.variation}s`,
            });
          return result;
        })
      : [];
  return (
    <main className="page compare-page">
      <Link className="back-link" to={`/project/${projectId}`}>
        <ArrowLeft size={15} />
        Back to simulation
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE SAME RUSH. A DIFFERENT SETUP.</div>
          <h1>Compare scenarios</h1>
          <p>See what changed. Understand the tradeoffs.</p>
        </div>
        <GitCompareArrows size={30} className="muted" />
      </div>
      {error && <p role="alert">{error}</p>}
      {!a || !b ? (
        <Empty title="Two runs. One fair comparison.">
          <p>
            Run a baseline, duplicate its scenario, then replay the same rush.
          </p>
          <Link className="button primary" to={`/project/${projectId}`}>
            Return to simulation
          </Link>
        </Empty>
      ) : (
        <>
          <div className="compare-selectors">
            <label>
              Scenario A
              <select value={left} onChange={(e) => setLeft(e.target.value)}>
                {runs.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.scenario.name}
                  </option>
                ))}
              </select>
            </label>
            <span>vs.</span>
            <label>
              Scenario B
              <select value={right} onChange={(e) => setRight(e.target.value)}>
                {runs.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.scenario.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={same ? "fairness" : "alert"}>
            {same
              ? "✓ Same customers. Same arrivals. Same order mix. Same seed."
              : "Different demand or seed: this is not a controlled same-rush comparison."}
            {a.id === b.id && " You selected the same run twice."}
          </div>
          <section className="comparison-hero">
            <div>
              <span className="eyebrow">{a.scenario.name}</span>
              <h2>{duration(a.summary.avgWait)}</h2>
              <p>Average queue wait</p>
            </div>
            <div
              className={`comparison-delta ${b.summary.avgWait < a.summary.avgWait ? "positive" : b.summary.avgWait > a.summary.avgWait ? "negative" : ""}`}
            >
              {b.summary.avgWait < a.summary.avgWait ? (
                <ArrowDownRight size={28} />
              ) : b.summary.avgWait > a.summary.avgWait ? (
                <ArrowUpRight size={28} />
              ) : (
                <Equal size={28} />
              )}
              <strong>
                {duration(Math.abs(a.summary.avgWait - b.summary.avgWait))}
              </strong>
              <span>
                {a.summary.avgWait
                  ? `${(Math.abs((b.summary.avgWait - a.summary.avgWait) / a.summary.avgWait) * 100).toFixed(1)}% ${b.summary.avgWait <= a.summary.avgWait ? "lower" : "higher"}`
                  : "No baseline queue delay"}
              </span>
              <small>in this simulation</small>
            </div>
            <div>
              <span className="eyebrow">{b.scenario.name}</span>
              <h2>{duration(b.summary.avgWait)}</h2>
              <p>Average queue wait</p>
            </div>
          </section>
          <section className="surface">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>{a.scenario.name}</th>
                  <th>{b.scenario.name}</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const delta = r.b - r.a,
                    good = r.lower ? delta < 0 : delta > 0;
                  return (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td>{r.format(r.a)}</td>
                      <td>{r.format(r.b)}</td>
                      <td
                        className={
                          delta === 0 ? "" : good ? "positive" : "negative"
                        }
                      >
                        {delta === 0
                          ? "No change"
                          : `${delta > 0 ? "↑" : "↓"} ${r.format(Math.abs(delta))}`}
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td>Primary Bottleneck</td>
                  <td>
                    {a.stations.find((s) => s.id === a.bottleneck)?.name ??
                      "None"}
                  </td>
                  <td>
                    {b.stations.find((s) => s.id === b.bottleneck)?.name ??
                      "None"}
                  </td>
                  <td>
                    {a.bottleneck === b.bottleneck ? "Unchanged" : "Shifted"}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
          <div className="comparison-details">
            <section className="surface">
              <h2>What changed?</h2>
              {changes.map((c, i) => (
                <div className="diff-row" key={i}>
                  <span>
                    {c.name}
                    <small>{c.label}</small>
                  </span>
                  <b>
                    {c.before} → {c.after}
                  </b>
                </div>
              ))}
              {JSON.stringify(a.scenario.links) !==
                JSON.stringify(b.scenario.links) && (
                <p>Workflow connections changed.</p>
              )}
              {JSON.stringify(a.scenario.orderTypes) !==
                JSON.stringify(b.scenario.orderTypes) && (
                <p>Order type definitions changed.</p>
              )}
              <div className="diff-row">
                <span>Total workers</span>
                <b>
                  {a.stations.reduce((n, s) => n + s.workers, 0)} →{" "}
                  {b.stations.reduce((n, s) => n + s.workers, 0)}
                </b>
              </div>
              {a.stations.reduce((n, s) => n + s.workers, 0) ===
                b.stations.reduce((n, s) => n + s.workers, 0) && (
                <p className="positive">No additional workers were added.</p>
              )}
            </section>
            <section className="surface">
              <h2>Where is the constraint now?</h2>
              <p className="bottleneck-shift">
                {a.stations.find((s) => s.id === a.bottleneck)?.name ?? "None"}{" "}
                <span>→</span>{" "}
                {b.stations.find((s) => s.id === b.bottleneck)?.name ?? "None"}
              </p>
              <p className="muted">
                The station with the largest accumulated queue delay ranks
                first. Reducing one constraint can expose another.
              </p>
            </section>
          </div>
          <section className="surface">
            <h2>
              {a.stations.find((s) => s.id === a.bottleneck)?.name ??
                a.stations[0]?.name}{" "}
              queue over time
            </h2>
            <QueueChart run={a} other={b} />
          </section>
          <p className="muted small">
            These results estimate behavior under the configured assumptions.
            They do not guarantee real-world improvements.
          </p>
        </>
      )}
    </main>
  );
}
