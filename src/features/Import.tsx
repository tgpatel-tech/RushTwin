import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Upload,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
} from "lucide-react";
import { parseCsv, validateCsv, type CsvMapping } from "../persistence/csv";
import { db, saveProject } from "../persistence/db";
import { download, duration, clock } from "../utils/format";
import type { Project } from "../types/model";
export function ImportPage() {
  const { projectId } = useParams(),
    navigate = useNavigate();
  const [step, setStep] = useState(1),
    [rows, setRows] = useState<Record<string, string>[]>([]),
    [fields, setFields] = useState<string[]>([]),
    [mapping, setMapping] = useState<CsvMapping>({
      arrival: "arrival_time",
      id: "order_id",
      type: "order_type",
      completion: "",
      drinkStart: "",
      drinkEnd: "",
      foodStart: "",
      foodEnd: "",
    }),
    [project, setProject] = useState<Project | null>(null),
    [error, setError] = useState(""),
    [fileName, setFileName] = useState(""),
    [parseErrors, setParseErrors] = useState<string[]>([]),
    [working, setWorking] = useState(false);
  const scenario = project?.scenarios.find(
    (s) => s.id === project.activeScenarioId,
  );
  const result = scenario
    ? validateCsv(rows, mapping, scenario.orderTypes)
    : null;
  async function load(file: File) {
    setError("");
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Choose a CSV smaller than 10 MB.");
      const p = await db.projects.get(projectId!);
      if (!p) throw new Error("Project not found.");
      const parsed = parseCsv(await file.text());
      if (!parsed.rows.length) throw new Error("No data rows found.");
      if (parsed.rows.length > 10000)
        throw new Error("Import up to 10,000 arrivals at a time.");
      setProject(p);
      setRows(parsed.rows);
      setFields(parsed.fields);
      setParseErrors(parsed.errors);
      setMapping({
        arrival: parsed.fields.includes("arrival_time")
          ? "arrival_time"
          : parsed.fields[0],
        id: parsed.fields.includes("order_id") ? "order_id" : "",
        type: parsed.fields.includes("order_type") ? "order_type" : "",
        completion: "",
        drinkStart: "",
        drinkEnd: "",
        foodStart: "",
        foodEnd: "",
      });
      setFileName(file.name);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to read CSV.");
    }
  }
  async function createReplay() {
    if (!project || !scenario || !result?.arrivals.length) return;
    setWorking(true);
    try {
      const s = structuredClone(scenario);
      s.id = crypto.randomUUID();
      s.name = `Imported · ${fileName.replace(/\.csv$/i, "")}`;
      const end = result.arrivals.at(-1)!.time;
      s.replay = {
        seed: s.demand.seed,
        duration: Math.max(1, end + 1),
        arrivals: result.arrivals,
      };
      s.demand = { ...s.demand, mode: "imported", duration: s.replay.duration };
      const p = {
        ...project,
        scenarios: [...project.scenarios, s],
        activeScenarioId: s.id,
        updatedAt: Date.now(),
      };
      await saveProject(p);
      navigate(`/project/${p.id}`);
    } catch {
      setError(
        "Could not save the imported scenario. Export or free browser storage and retry.",
      );
    } finally {
      setWorking(false);
    }
  }
  return (
    <main className="page import-page">
      <Link className="back-link" to={`/project/${projectId}`}>
        <ArrowLeft size={15} />
        Back to simulation
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">REAL DEMAND. NEW POSSIBILITIES.</div>
          <h1>Import rush data</h1>
          <p>Replay a real arrival pattern under a different workflow.</p>
        </div>
      </div>
      <div className="import-progress">
        {["Upload", "Map columns", "Validate", "Import"].map((s, i) => (
          <div
            className={step === i + 1 ? "active" : step > i + 1 ? "done" : ""}
            key={s}
          >
            <span>{step > i + 1 ? "✓" : i + 1}</span>
            {s}
            {i < 3 && <ArrowRight size={14} />}
          </div>
        ))}
      </div>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      {step === 1 && (
        <section className="surface">
          <div
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) void load(e.dataTransfer.files[0]);
            }}
          >
            <span className="upload-symbol">
              <Upload size={28} />
            </span>
            <h2>Bring your rush into the lab.</h2>
            <p>Drop a CSV here, or choose a file. Up to 10 MB.</p>
            <label className="button primary file-button">
              Choose File
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) void load(e.target.files[0]);
                }}
              />
            </label>
          </div>
          <div className="import-footer">
            <span>
              No names, payment information, or customer identities are
              required.
              <br />
              Files are processed locally in your browser.
            </span>
            <a href={`${import.meta.env.BASE_URL}samples/sample_rush.csv`} download>
              <Download size={15} />
              Download Sample CSV
            </a>
          </div>
        </section>
      )}
      {step === 2 && (
        <section className="surface">
          <h2>Map your columns</h2>
          <p className="muted">
            {fileName} · {rows.length} rows · times may be seconds, HH:MM:SS, or
            ISO timestamps with timezone.
          </p>
          {(Object.keys(mapping) as (keyof CsvMapping)[]).map((key) => (
            <label className="mapping-row" key={key}>
              <span>
                {
                  {
                    arrival: "Arrival Time *",
                    id: "Order ID",
                    type: "Order Type",
                    completion: "Completion Time",
                    drinkStart: "Drink Start",
                    drinkEnd: "Drink End",
                    foodStart: "Food Start",
                    foodEnd: "Food End",
                  }[key]
                }
              </span>
              <select
                aria-label={key === "arrival" ? "Arrival Time" : key}
                value={mapping[key]}
                onChange={(e) =>
                  setMapping({ ...mapping, [key]: e.target.value })
                }
              >
                {key !== "arrival" && <option value="">Not mapped</option>}
                {fields.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
          ))}
          <p className="muted small">
            Unmapped IDs are generated. Unmapped order types use the first
            configured type. Valid types:{" "}
            {scenario?.orderTypes.map((t) => `${t.id} (${t.name})`).join(", ")}.
          </p>
          <div className="modal-actions">
            <button onClick={() => setStep(1)}>Back</button>
            <button
              className="primary"
              disabled={!mapping.arrival}
              onClick={() => setStep(3)}
            >
              Validate Data
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
      )}
      {step === 3 && result && (
        <section className="surface">
          <h2>Check your data</h2>
          <div className="validation-summary">
            <div>
              <strong>{rows.length}</strong>
              <span>rows found</span>
            </div>
            <div>
              <strong className="positive">{result.arrivals.length}</strong>
              <span>valid arrivals</span>
            </div>
            <div>
              <strong className="negative">{result.errors.length}</strong>
              <span>require attention</span>
            </div>
          </div>
          {parseErrors.length > 0 && (
            <div className="alert">
              CSV structure errors must be fixed before import.
              {parseErrors.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}
          {result.errors.length > 0 && (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.slice(0, 100).map((e) => (
                    <tr key={e.row}>
                      <td>{e.row}</td>
                      <td>{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={() =>
                  download(
                    "import-errors.csv",
                    "row,error\n" +
                      result.errors
                        .map(
                          (e) =>
                            `${e.row},"${e.message.replaceAll('"', '""')}"`,
                        )
                        .join("\n"),
                    "text/csv",
                  )
                }
              >
                <Download size={14} />
                Download Error Report
              </button>
            </>
          )}
          <div className="modal-actions">
            <button onClick={() => setStep(2)}>Back</button>
            <button
              className="primary"
              disabled={!result.arrivals.length || parseErrors.length > 0}
              onClick={() => setStep(4)}
            >
              {result.errors.length ? "Skip Invalid Rows" : "Continue"}
            </button>
          </div>
        </section>
      )}
      {step === 4 && result && (
        <section className="surface import-success">
          <CheckCircle2 size={40} />
          <h2>{result.arrivals.length} arrivals ready to replay.</h2>
          <p>
            First arrival: {clock(0)} · Last arrival:{" "}
            {clock(result.arrivals.at(-1)?.time ?? 0)}
          </p>
          <p>Duration: {duration(result.arrivals.at(-1)?.time ?? 0)}</p>
          <p className="muted">
            Original timestamp offsets are preserved and displayed relative to
            7:00 AM. This simulation reuses the imported demand timing; results
            estimate behavior under your workflow assumptions.
          </p>
          <button
            className="primary"
            disabled={working}
            onClick={() => void createReplay()}
          >
            {working ? "Saving replay…" : "Create Replay Scenario"}
            <ArrowRight size={16} />
          </button>
        </section>
      )}
    </main>
  );
}
