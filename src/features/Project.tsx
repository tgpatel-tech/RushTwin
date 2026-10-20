import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import {
  Plus,
  Undo2,
  Redo2,
  Copy,
  Play,
  RotateCcw,
  GitCompareArrows,
  Scan,
  Upload,
  Download,
  SlidersHorizontal,
  Check,
  ArrowRight,
} from "lucide-react";
import { db, saveProject } from "../persistence/db";
import { createProject } from "../persistence/templates";
import { useEditor } from "../stores/editor";
import { usePlayback } from "../stores/playback";
import { simulate } from "../simulation/engine";
import { validateWorkflow } from "../simulation/validation";
import type { Run } from "../types/model";
import { download } from "../utils/format";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { Inspector } from "./Inspector";
import { ResultsPanel } from "./ResultsPanel";
import { Modal } from "../components/Common";
export function ProjectPage({ demo = false }: { demo?: boolean }) {
  return (
    <ReactFlowProvider>
      <ProjectEditor demo={demo} />
    </ReactFlowProvider>
  );
}
function ProjectEditor({ demo }: { demo: boolean }) {
  const { projectId } = useParams(),
    navigate = useNavigate(),
    editor = useEditor(),
    playback = usePlayback(),
    flow = useReactFlow();
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [customer, setCustomer] = useState<string | null>(null),
    [showInspector, setShowInspector] = useState(
      () => window.innerWidth >= 1200,
    ),
    [modal, setModal] = useState<"duplicate" | "station" | "experiment" | null>(
      null,
    ),
    [name, setName] = useState("More Drink Capacity"),
    [stationName, setStationName] = useState("Custom Station"),
    [runs, setRuns] = useState<Run[]>([]),
    [busy, setBusy] = useState(false),
    [mobileTab, setMobileTab] = useState("Workflow"),
    [notice, setNotice] = useState("");
  const project = editor.project,
    scenario = project?.scenarios.find(
      (s) => s.id === project.activeScenarioId,
    );
  const run = playback.run?.scenarioId === scenario?.id ? playback.run : null;
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await useEditor.getState().flush();
        let p = demo
          ? await db.projects.get("demo")
          : await db.projects.get(projectId!);
        if (!p && demo) {
          p = { ...createProject("Morning Café Rush"), id: "demo" };
          await saveProject(p);
        }
        if (!p)
          throw new Error(
            "Project not found. Return to Projects or import a backup.",
          );
        const savedRuns = await db.runs
          .where("projectId")
          .equals(p.id)
          .sortBy("createdAt");
        if (!active) return;
        useEditor.getState().load(p);
        setRuns(savedRuns);
        const latest = savedRuns
          .filter((r) => r.scenarioId === p.activeScenarioId)
          .at(-1);
        usePlayback.setState({
          run: latest ?? null,
          time: latest?.summary.duration ?? 0,
          playing: false,
          tab: latest ? "Results" : "Live",
        });
      } catch (e) {
        if (active) setError(String(e));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      void useEditor
        .getState()
        .flush()
        .catch(() => {});
    };
  }, [projectId, demo]);
  useEffect(() => {
    let frame = 0,
      last = performance.now();
    function animate(now: number) {
      usePlayback.getState().tick(Math.min(0.25, (now - last) / 1000));
      last = now;
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (run && playback.time === run.summary.duration && !playback.playing)
      setNotice(
        `Simulation complete · ${run.summary.completed} customers processed`,
      );
  }, [run, playback.time, playback.playing]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  if (loading) return <div className="page">Loading project…</div>;
  if (!project || !scenario)
    return (
      <div className="page">
        <div role="alert" className="alert">
          {error}
        </div>
        <Link to="/">Return to Projects</Link>
      </div>
    );
  const validation = validateWorkflow(scenario);
  const replaySource =
    run ?? [...runs].reverse().find((r) => r.projectId === project.id);
  const changed =
    run &&
    JSON.stringify({ ...scenario, name: "" }) !==
      JSON.stringify({ ...run.scenario, name: "" });
  async function execute(replay = false) {
    if (!scenario || !project) return;
    setBusy(true);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 30));
    try {
      const result = simulate(
        scenario,
        replay ? (scenario.replay ?? replaySource?.demand) : undefined,
        project.id,
      );
      await db.runs.put(result);
      setRuns((prev) => [...prev, result]);
      playback.setRun(result);
      if (playback.speed === 0) playback.setSpeed(0);
      setMobileTab("Run");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed.");
    } finally {
      setBusy(false);
    }
  }
  function duplicate(experiment = false) {
    editor.change((p) => {
      const next = structuredClone(
        p.scenarios.find((s) => s.id === p.activeScenarioId)!,
      );
      next.id = crypto.randomUUID();
      next.name = experiment ? "Reallocated" : name.trim() || "Scenario Copy";
      next.replay = replaySource?.demand;
      if (experiment) {
        next.stations.find((n) => n.id === "order")!.workers = 1;
        next.stations.find((n) => n.id === "drinks")!.workers = 2;
      }
      p.scenarios.push(next);
      p.activeScenarioId = next.id;
    });
    usePlayback.setState({ run: null, playing: false, time: 0 });
    setSelected(null);
    setModal(null);
    setNotice("Scenario created. Replay the same rush to compare.");
  }
  return (
    <main
      className={`project-page mobile-${mobileTab.toLowerCase()} ${showInspector ? "inspector-open" : ""}`}
    >
      {demo && (
        <div className="demo-banner">
          <div>
            <span className="eyebrow">MORNING CAFÉ RUSH</span>
            <h1>Can the same team handle the same rush more efficiently?</h1>
          </div>
          <div className="demo-steps">
            <span className={runs.length ? "done" : "active"}>
              1 Run baseline
            </span>
            <ArrowRight size={14} />
            <span className={project.scenarios.length > 1 ? "done" : ""}>
              2 Test a change
            </span>
            <ArrowRight size={14} />
            <span>3 Compare</span>
          </div>
          <button
            onClick={async () => {
              if (
                confirm(
                  "Reset the demo and remove its saved scenarios and runs?",
                )
              ) {
                await db.runs.where("projectId").equals("demo").delete();
                const p = { ...createProject("Morning Café Rush"), id: "demo" };
                await saveProject(p);
                editor.load(p);
                setRuns([]);
                usePlayback.setState({ run: null, playing: false, time: 0 });
              }
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      )}
      <div className="project-toolbar">
        <div className="toolbar-group">
          <button onClick={() => setModal("station")}>
            <Plus size={16} />
            Add Station
          </button>
          <button
            className="icon-button"
            title="Fit view"
            aria-label="Fit view"
            onClick={() => void flow.fitView({ padding: 0.15, duration: 250 })}
          >
            <Scan size={17} />
          </button>
          <button
            className="icon-button"
            title="Undo"
            aria-label="Undo"
            disabled={!editor.past.length}
            onClick={editor.undo}
          >
            <Undo2 size={17} />
          </button>
          <button
            className="icon-button"
            title="Redo"
            aria-label="Redo"
            disabled={!editor.future.length}
            onClick={editor.redo}
          >
            <Redo2 size={17} />
          </button>
          <span className="toolbar-divider" />
          <select
            aria-label="Current scenario"
            value={scenario.id}
            onChange={(e) => {
              const id = e.target.value;
              editor.change((p) => {
                p.activeScenarioId = id;
              }, false);
              const r = runs.filter((r) => r.scenarioId === id).at(-1);
              usePlayback.setState({
                run: r ?? null,
                time: r?.summary.duration ?? 0,
                playing: false,
                tab: r ? "Results" : "Live",
              });
            }}
          >
            {project.scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            className="icon-button"
            title="Duplicate scenario"
            aria-label="Duplicate Scenario"
            onClick={() => setModal("duplicate")}
          >
            <Copy size={16} />
          </button>
        </div>
        <div className="toolbar-group">
          <button
            className="primary"
            disabled={busy}
            onClick={() => void execute()}
          >
            <Play size={15} />
            {busy
              ? "Preparing simulation…"
              : demo && project.scenarios.length === 1
                ? "Run Baseline"
                : "Run Rush"}
          </button>
          <button
            disabled={!replaySource || busy}
            onClick={() => void execute(true)}
          >
            <RotateCcw size={15} />
            <span>Replay Same Rush</span>
          </button>
          <Link className="button" to={`/project/${project.id}/compare`}>
            <GitCompareArrows size={16} />
            <span>Compare</span>
          </Link>
          <button
            className="icon-button"
            title="Simulation setup"
            aria-label="Simulation setup"
            onClick={() => {
              setSelected(null);
              setCustomer(null);
              setShowInspector(!showInspector);
            }}
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </div>
      <div className="mobile-tabs">
        {["Workflow", "Run", "Results"].map((t) => (
          <button
            className={mobileTab === t ? "active" : ""}
            key={t}
            onClick={() => {
              setMobileTab(t);
              if (t === "Results") playback.setTab("Results");
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="scenario-strip">
        <div>
          <span className="status-dot" />
          <input
            aria-label="Scenario name"
            value={scenario.name}
            maxLength={120}
            onChange={(e) =>
              editor.edit((s) => {
                s.name = e.target.value;
              })
            }
          />
          <span>
            {scenario.stations.reduce((a, s) => a + s.workers, 0)} workers ·{" "}
            {scenario.stations.filter((n) => n.kind === "station").length}{" "}
            stations
          </span>
          {changed && (
            <span className="badge warning">
              Configuration changed · rerun for new results
            </span>
          )}
        </div>
        <div className="actions">
          <Link to={`/project/${project.id}/import`}>
            <Upload size={13} />
            Import CSV
          </Link>
          <button
            className="text-button"
            onClick={() =>
              download(
                `${project.name}.rushtwin.json`,
                JSON.stringify(project, null, 2),
              )
            }
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>
      {error && (
        <div role="alert" className="alert">
          {error}
        </div>
      )}
      {validation.errors.length > 0 && (
        <details className="validation">
          <summary>
            {validation.errors.length} workflow issue(s) to resolve
          </summary>
          {validation.errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </details>
      )}
      {validation.warnings.map((w) => (
        <div className="warning-note compact" key={w}>
          {w}
        </div>
      ))}
      {demo &&
        run &&
        playback.time === run.summary.duration &&
        project.scenarios.length === 1 && (
          <div className="experiment-banner">
            <span>
              <b>
                Primary bottleneck:{" "}
                {run.stations.find((s) => s.id === run.bottleneck)?.name ??
                  "None"}
                .
              </b>{" "}
              Test a different allocation with the same five workers.
            </span>
            <button className="primary" onClick={() => setModal("experiment")}>
              Test a Change
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      {demo && project.scenarios.length > 1 && (
        <div className="experiment-banner">
          <span>
            Same customers. Same arrival times. Same order mix. Different
            staffing.
          </span>
          {runs.some((r) => r.scenarioId === scenario.id) && (
            <button
              className="primary"
              onClick={() => navigate(`/project/${project.id}/compare`)}
            >
              Compare the results
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
      <div className="workspace">
        <WorkflowCanvas
          scenario={scenario}
          run={run}
          time={playback.time}
          selected={selected}
          onSelect={(id) => {
            setSelected(id);
            setCustomer(null);
            if (id) setShowInspector(true);
          }}
          onCustomer={(id) => {
            setCustomer(id);
            setShowInspector(true);
          }}
        />
        {showInspector && (
          <Inspector
            scenario={scenario}
            selected={selected}
            customer={run?.customers.find((c) => c.id === customer)}
            run={run}
            onClose={() => {
              setSelected(null);
              setCustomer(null);
              if (window.innerWidth < 1200) setShowInspector(false);
            }}
          />
        )}
      </div>
      <ResultsPanel
        scenario={scenario}
        run={run}
        onCustomer={(id) => {
          setCustomer(id);
          setShowInspector(true);
        }}
      />
      {notice && (
        <div role="status" className="toast">
          <Check size={17} />
          {notice}
        </div>
      )}
      {modal === "duplicate" && (
        <Modal
          title={`Duplicate “${scenario.name}”`}
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              duplicate();
            }}
          >
            <label>
              Scenario name
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
              />
            </label>
            <p className="muted">
              Keep the workflow, seed, and recorded demand. Change the setup and
              replay the same rush.
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="primary">Duplicate</button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "station" && (
        <Modal title="Add station" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const id = crypto.randomUUID();
              editor.edit((s) => {
                s.stations.push({
                  id,
                  name: stationName,
                  kind:
                    stationName === "Customers Entry"
                      ? "entry"
                      : stationName === "Complete Exit"
                        ? "exit"
                        : "station",
                  workers:
                    stationName.endsWith("Entry") ||
                    stationName.endsWith("Exit")
                      ? 0
                      : 1,
                  service: { kind: "uniform", mean: 40, variation: 10 },
                  position: flow.screenToFlowPosition({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                  }),
                });
                if (
                  !stationName.endsWith("Entry") &&
                  !stationName.endsWith("Exit")
                )
                  s.orderTypes.forEach((t) => t.stations.push(id));
              });
              setSelected(id);
              setShowInspector(true);
              setModal(null);
            }}
          >
            <label>
              Station type
              <select
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
              >
                {[
                  "Customers Entry",
                  "Complete Exit",
                  "Register / Ordering",
                  "Drink Preparation",
                  "Food Preparation",
                  "Kitchen",
                  "Packing",
                  "Quality Check",
                  "Pickup",
                  "Checkout",
                  "Custom Station",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <p className="muted">
              Connect this station to the workflow using its handles. It is
              initially included in every order type.
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="primary">Add Station</button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "experiment" && (
        <Modal title="Try this experiment" onClose={() => setModal(null)}>
          <p>Move one worker from Order to Drinks.</p>
          <div className="experiment-rows">
            <div>
              <span>Order</span>
              <b>2 → 1</b>
            </div>
            <div>
              <span>Drinks</span>
              <b>1 → 2</b>
            </div>
            <div>
              <span>Total workers</span>
              <b>5 → 5</b>
            </div>
          </div>
          <p className="muted">
            A staffing experiment, not an automatic recommendation. No
            additional workers are added.
          </p>
          <button
            className="primary full-width"
            onClick={() => duplicate(true)}
          >
            Apply Experiment
          </button>
        </Modal>
      )}
    </main>
  );
}
