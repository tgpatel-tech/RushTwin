import { useState } from "react";
import {
  X,
  Minus,
  Plus,
  Trash2,
  Shuffle,
  SlidersHorizontal,
} from "lucide-react";
import type {
  Scenario,
  Run,
  Station,
  CustomerResult,
  Distribution,
} from "../types/model";
import { useEditor } from "../stores/editor";
import { clock, duration } from "../utils/format";
export function Inspector({
  scenario,
  selected,
  customer,
  run,
  onClose,
}: {
  scenario: Scenario;
  selected: string | null;
  customer: CustomerResult | undefined;
  run: Run | null;
  onClose: () => void;
}) {
  const edit = useEditor((s) => s.edit),
    [advanced, setAdvanced] = useState(false);
  const st = scenario.stations.find((n) => n.id === selected);
  function patch(fn: (n: Station) => void) {
    edit((s) => {
      const n = s.stations.find((n) => n.id === selected);
      if (n) fn(n);
    });
  }
  if (customer)
    return (
      <aside className="inspector">
        <header>
          <h2>Order #{customer.id}</h2>
          <button
            className="icon-button"
            aria-label="Close inspector"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <span className="badge blue">
          {customer.completed !== undefined ? "Completed" : "Unfinished"}
        </span>
        <p>{scenario.orderTypes.find((t) => t.id === customer.type)?.name}</p>
        <div className="customer-timeline">
          <div>
            <b>Arrival</b>
            <span>{clock(customer.time)}</span>
          </div>
          {customer.visits.map((v) => (
            <div key={v.stationId}>
              <b>
                {run?.scenario.stations.find((n) => n.id === v.stationId)?.name}
              </b>
              <span>
                Queued{" "}
                {duration(
                  (v.start ?? run?.summary.duration ?? v.queued) - v.queued,
                )}
              </span>
              <small>
                {v.start === undefined
                  ? "Waiting for a worker"
                  : `${clock(v.start)} → ${v.end !== undefined ? clock(v.end) : "In service"}`}
              </small>
              <span>Service {duration(v.duration ?? 0)}</span>
            </div>
          ))}
          <div>
            <b>
              {customer.completed !== undefined
                ? "Completed"
                : "Still in system"}
            </b>
            <span>
              {customer.completed !== undefined
                ? clock(customer.completed)
                : "—"}
            </span>
          </div>
        </div>
        <p>
          Queue delay: <b>{duration(customer.wait)}</b>
        </p>
        <p>
          Processing effort: <b>{duration(customer.service)}</b>
        </p>
        <p>
          Time in system: <b>{duration(customer.total)}</b>
        </p>
        <small className="muted">
          Parallel task durations overlap; summed processing and queue effort
          may exceed elapsed time.
        </small>
      </aside>
    );
  return (
    <aside className="inspector">
      <header>
        <h2>{st ? st.name : "Simulation Setup"}</h2>
        {st ? (
          <button
            className="icon-button"
            aria-label="Close inspector"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        ) : (
          <SlidersHorizontal size={18} />
        )}
      </header>
      {st ? (
        <>
          <label>
            Station name
            <input
              maxLength={80}
              value={st.name}
              onChange={(e) =>
                patch((n) => {
                  n.name = e.target.value;
                })
              }
            />
          </label>
          {st.kind === "station" && (
            <>
              <section>
                <h3>CAPACITY</h3>
                <div className="capacity">
                  <span>Workers</span>
                  <div className="stepper">
                    <button
                      aria-label="Remove worker"
                      disabled={st.workers === 0}
                      onClick={() => patch((n) => n.workers--)}
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      aria-label="Workers"
                      type="number"
                      min="0"
                      max="100"
                      value={st.workers}
                      onChange={(e) =>
                        patch((n) => {
                          n.workers = Math.max(
                            0,
                            Math.min(100, Number(e.target.value)),
                          );
                        })
                      }
                    />
                    <button
                      aria-label="Add worker"
                      disabled={st.workers === 100}
                      onClick={() => patch((n) => n.workers++)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                {st.workers === 0 && (
                  <p className="warning-note">
                    No workers are assigned. Orders reaching this station will
                    remain queued.
                  </p>
                )}
              </section>
              <section>
                <div className="section-inline">
                  <h3>PROCESSING TIME</h3>
                  <button
                    className="text-button"
                    onClick={() => setAdvanced(!advanced)}
                  >
                    {advanced ? "Simple" : "Advanced"}
                  </button>
                </div>
                {advanced && (
                  <label>
                    Distribution
                    <select
                      value={st.service.kind}
                      onChange={(e) =>
                        patch((n) => {
                          n.service.kind = e.target
                            .value as Distribution["kind"];
                        })
                      }
                    >
                      {["fixed", "uniform", "normal", "triangular"].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  {st.service.kind === "triangular"
                    ? "Mode / center"
                    : "Average service time"}
                  <div className="input-unit">
                    <input
                      type="number"
                      min="0.001"
                      step="1"
                      value={st.service.mean}
                      onChange={(e) =>
                        patch((n) => {
                          n.service.mean = Number(e.target.value);
                        })
                      }
                    />
                    <span>seconds</span>
                  </div>
                </label>
                {st.service.kind !== "fixed" && (
                  <label>
                    {st.service.kind === "normal"
                      ? "Standard deviation"
                      : "Variation (±)"}
                    <div className="input-unit">
                      <input
                        type="number"
                        min="0"
                        value={st.service.variation}
                        onChange={(e) =>
                          patch((n) => {
                            n.service.variation = Number(e.target.value);
                          })
                        }
                      />
                      <span>seconds</span>
                    </div>
                  </label>
                )}
                <small className="muted">
                  {st.service.kind === "normal"
                    ? "Normal durations clamp to a minimum of 0.001 seconds."
                    : `Range: ${Math.max(0.001, st.service.mean - (st.service.kind === "fixed" ? 0 : st.service.variation)).toFixed(0)}–${(st.service.mean + (st.service.kind === "fixed" ? 0 : st.service.variation)).toFixed(0)} seconds.`}
                </small>
              </section>
              <section>
                <h3>QUEUE POLICY</h3>
                <p>
                  First In, First Out <span className="badge">FIFO</span>
                </p>
              </section>
              <section>
                <h3>ORDER TYPES USING THIS STATION</h3>
                {scenario.orderTypes.map((t) => (
                  <label className="check-label" key={t.id}>
                    <input
                      type="checkbox"
                      checked={t.stations.includes(st.id)}
                      onChange={(e) =>
                        edit((s) => {
                          const target = s.orderTypes.find(
                            (v) => v.id === t.id,
                          )!;
                          target.stations = e.target.checked
                            ? [...target.stations, st.id]
                            : target.stations.filter((id) => id !== st.id);
                        })
                      }
                    />
                    {t.name}
                  </label>
                ))}
              </section>
            </>
          )}
          <section>
            <h3>ROUTING</h3>
            {scenario.links
              .filter((e) => e.source === st.id)
              .map((e) => (
                <div className="routing-row" key={e.id}>
                  <span>
                    → {scenario.stations.find((n) => n.id === e.target)?.name}
                  </span>
                  <button
                    className="icon-button"
                    aria-label="Remove connection"
                    onClick={() =>
                      edit((s) => {
                        s.links = s.links.filter((l) => l.id !== e.id);
                      })
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            <small className="muted">
              Drag output to input to connect. All selected predecessor tasks
              must finish before a join begins.
            </small>
          </section>
          <button
            className="danger-button"
            onClick={() => {
              edit((s) => {
                s.stations = s.stations.filter((n) => n.id !== st.id);
                s.links = s.links.filter(
                  (e) => e.source !== st.id && e.target !== st.id,
                );
                s.orderTypes.forEach((t) => {
                  t.stations = t.stations.filter((id) => id !== st.id);
                });
              });
              onClose();
            }}
          >
            <Trash2 size={15} />
            Delete Station
          </button>
        </>
      ) : (
        <>
          <section>
            <h3>DEMAND</h3>
            <label>
              Mode
              <select
                value={scenario.demand.mode}
                onChange={(e) =>
                  edit((s) => {
                    s.demand.mode = e.target
                      .value as Scenario["demand"]["mode"];
                  })
                }
              >
                <option value="generated">Generated</option>
                <option value="schedule">Rush Schedule</option>
                <option value="imported">Imported Replay</option>
              </select>
            </label>
            <label>
              Duration (minutes)
              <input
                type="number"
                min="1"
                max="1440"
                value={scenario.demand.duration / 60}
                onChange={(e) =>
                  edit((s) => {
                    s.demand.duration = Number(e.target.value) * 60;
                  })
                }
              />
            </label>
            {scenario.demand.mode === "generated" && (
              <label>
                Customers / hour
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={scenario.demand.rate}
                  onChange={(e) =>
                    edit((s) => {
                      s.demand.rate = Number(e.target.value);
                    })
                  }
                />
              </label>
            )}
            {scenario.demand.mode === "schedule" && (
              <>
                <div className="interval-labels">
                  <span>Start min</span>
                  <span>End min</span>
                  <span>/ hour</span>
                </div>
                {scenario.demand.intervals.map((interval, i) => (
                  <div className="interval-row" key={i}>
                    {(["start", "end", "rate"] as const).map((key) => (
                      <input
                        key={key}
                        aria-label={`Interval ${i + 1} ${key}`}
                        type="number"
                        min="0"
                        value={
                          key === "rate" ? interval[key] : interval[key] / 60
                        }
                        onChange={(e) =>
                          edit((s) => {
                            s.demand.intervals[i][key] =
                              Number(e.target.value) *
                              (key === "rate" ? 1 : 60);
                          })
                        }
                      />
                    ))}
                    <button
                      className="icon-button"
                      aria-label={`Remove interval ${i + 1}`}
                      onClick={() =>
                        edit((s) => {
                          s.demand.intervals.splice(i, 1);
                        })
                      }
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  className="text-button"
                  onClick={() =>
                    edit((s) => {
                      const start = s.demand.intervals.at(-1)?.end ?? 0;
                      s.demand.intervals.push({
                        start,
                        end: start + 900,
                        rate: 60,
                      });
                      s.demand.duration = Math.max(
                        s.demand.duration,
                        start + 900,
                      );
                    })
                  }
                >
                  <Plus size={13} />
                  Add Interval
                </button>
              </>
            )}
            {scenario.demand.mode === "imported" && (
              <p>
                {scenario.replay
                  ? `${scenario.replay.arrivals.length} imported arrivals`
                  : "Use Import CSV to load a replay."}
              </p>
            )}
          </section>
          <section>
            <h3>ORDER TYPES</h3>
            {scenario.orderTypes.map((t) => (
              <label className="mix-row" key={t.id}>
                <span>{t.name}</span>
                <input
                  aria-label={`${t.name} percentage`}
                  type="number"
                  min="0"
                  max="100"
                  value={t.weight}
                  onChange={(e) =>
                    edit((s) => {
                      s.orderTypes.find((v) => v.id === t.id)!.weight = Number(
                        e.target.value,
                      );
                    })
                  }
                />
                <span>%</span>
              </label>
            ))}
            <small
              className={
                scenario.orderTypes.reduce((a, t) => a + t.weight, 0) === 100
                  ? "muted"
                  : "error-text"
              }
            >
              Total: {scenario.orderTypes.reduce((a, t) => a + t.weight, 0)}% ·
              must equal 100%
            </small>
          </section>
          <section>
            <h3>RANDOM SEED</h3>
            <div className="seed-row">
              <input
                aria-label="Random seed"
                type="number"
                value={scenario.demand.seed}
                onChange={(e) =>
                  edit((s) => {
                    s.demand.seed = Number(e.target.value);
                  })
                }
              />
              <button
                aria-label="Generate new seed"
                onClick={() =>
                  edit((s) => {
                    s.demand.seed = crypto.getRandomValues(
                      new Uint32Array(1),
                    )[0];
                  })
                }
              >
                <Shuffle size={16} />
              </button>
            </div>
            <p className="muted small">
              Same seed. Same customers.
              <br />A fair test of a different setup.
            </p>
          </section>
          <div className="assumption-note">
            A model of your operation.
            <br />
            An experiment, not a prediction.
          </div>
        </>
      )}
    </aside>
  );
}
