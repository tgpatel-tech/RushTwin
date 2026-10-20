import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  ArrowUpRight,
  ArrowRight,
  Clock,
  Copy,
  Download,
  Trash2,
  Upload,
  Workflow,
  GitBranch,
  Coffee,
  Utensils,
  Search,
} from "lucide-react";
import type { Project } from "../types/model";
import { db, saveProject, deleteProject } from "../persistence/db";
import { createProject, templateNames } from "../persistence/templates";
import { projectSchema } from "../persistence/schema";
import { download } from "../utils/format";
import { MiniFlow, Modal } from "../components/Common";
export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]),
    [modal, setModal] = useState(false),
    [name, setName] = useState("Untitled Simulation"),
    [template, setTemplate] = useState("Café Rush"),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const navigate = useNavigate(),
    file = useRef<HTMLInputElement>(null);
  const refresh = () =>
    db.projects
      .orderBy("updatedAt")
      .reverse()
      .toArray()
      .then(setProjects)
      .catch(() =>
        setError(
          "Browser storage is unavailable. Enable IndexedDB to save projects.",
        ),
      )
      .finally(() => setLoading(false));
  useEffect(() => {
    void refresh();
  }, []);
  async function create() {
    try {
      const p = createProject(name.trim() || "Untitled Simulation", template);
      await saveProject(p);
      navigate(`/project/${p.id}`);
    } catch {
      setError("Unable to create project in browser storage.");
    }
  }
  async function importFile(f: File) {
    try {
      if (f.size > 10 * 1024 * 1024) throw new Error("File exceeds 10 MB.");
      const parsed = projectSchema.safeParse(JSON.parse(await f.text()));
      if (!parsed.success)
        throw new Error(
          "This is not a valid RushTwin project (schema version 1).",
        );
      const p = {
        ...parsed.data,
        id: crypto.randomUUID(),
        updatedAt: Date.now(),
      };
      await saveProject(p);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not import project.");
    }
  }
  return (
    <main className="dashboard page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR OPERATIONS LAB</div>
          <h1>Test the rush before it happens.</h1>
          <p>Build your workflow. Run the rush. Find a better way.</p>
        </div>
        <div className="actions">
          <Link className="button" to="/demo">
            <FlaskIcon />
            Try Demo Rush
          </Link>
          <button className="primary" onClick={() => setModal(true)}>
            <Plus size={17} />
            New Simulation
          </button>
        </div>
      </div>
      <section className="featured">
        <div className="feature-copy">
          <span className="badge blue">
            <span className="status-dot" />
            FEATURED DEMO
          </span>
          <h2>Morning Café Rush</h2>
          <p>
            One busy morning. Five workers. A growing drink queue.
            <br />
            Can the same team handle the same rush more efficiently?
          </p>
          <div className="actions">
            <Link className="primary button" to="/demo">
              Open Demo
              <ArrowRight size={16} />
            </Link>
            <Link className="text-link" to="/how-it-works">
              How it works
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
        <div className="feature-visual">
          <div className="flow-kicker">
            <span className="status-dot" />A SMALL CHANGE. A DIFFERENT OUTCOME.
          </div>
          <MiniFlow large />
          <div className="flow-caption">
            <span>Parallel preparation</span>
            <span>One synchronized pickup</span>
          </div>
        </div>
      </section>
      <section>
        <div className="section-heading">
          <div>
            <h2>
              Recent simulations{" "}
              <span className="count">{projects.length}</span>
            </h2>
            <p>Your workflows, experiments, and what you learned.</p>
          </div>
          <div className="actions">
            <label className="search">
              <Search size={16} />
              <input
                aria-label="Search simulations"
                placeholder="Find a simulation…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button onClick={() => file.current?.click()}>
              <Upload size={16} />
              Import project
            </button>
            <input
              hidden
              ref={file}
              type="file"
              accept=".json"
              onChange={(e) => {
                if (e.target.files?.[0]) void importFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        {error && (
          <div role="alert" className="alert">
            {error}
          </div>
        )}
        {loading ? (
          <p>Loading projects…</p>
        ) : projects.length === 0 ? (
          <div className="project-empty">
            <div className="empty-icon">
              <Workflow size={28} />
            </div>
            <div>
              <h3>Your next experiment starts here.</h3>
              <p>
                Create a simulation, or explore the café demo to see queues in
                action.
              </p>
            </div>
            <button onClick={() => setModal(true)}>
              Create Simulation
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="project-grid">
            {projects
              .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
              .map((p) => (
                <article className="project-card" key={p.id}>
                  <Link to={`/project/${p.id}`}>
                    <div className="card-top">
                      <span className="project-icon">
                        <Workflow size={20} />
                      </span>
                      <ArrowUpRight size={17} />
                    </div>
                    <h3>{p.name}</h3>
                    <p>
                      {
                        p.scenarios[0].stations.filter(
                          (s) => s.kind === "station",
                        ).length
                      }{" "}
                      stations <span>·</span> {p.scenarios.length} scenario
                      {p.scenarios.length !== 1 ? "s" : ""}
                    </p>
                    <div className="card-foot">
                      <Clock size={13} />
                      {new Date(p.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                      <span className="badge">Local project</span>
                    </div>
                  </Link>
                  <div className="card-tools">
                    <button
                      title="Duplicate project"
                      aria-label={`Duplicate ${p.name}`}
                      onClick={async () => {
                        await saveProject({
                          ...structuredClone(p),
                          id: crypto.randomUUID(),
                          name: `${p.name} Copy`,
                          updatedAt: Date.now(),
                        });
                        await refresh();
                      }}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      title="Export project"
                      aria-label={`Export ${p.name}`}
                      onClick={() =>
                        download(
                          `${p.name}.rushtwin.json`,
                          JSON.stringify(p, null, 2),
                        )
                      }
                    >
                      <Download size={14} />
                    </button>
                    <button
                      title="Delete project"
                      aria-label={`Delete ${p.name}`}
                      onClick={async () => {
                        if (confirm(`Delete “${p.name}” and its saved runs?`)) {
                          await deleteProject(p.id);
                          await refresh();
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>
      <section>
        <div className="section-heading">
          <div>
            <h2>Start from a template</h2>
            <p>A starting point for the way your operation works.</p>
          </div>
          <span className="subtle-label">MAKE IT YOUR OWN</span>
        </div>
        <div className="template-grid">
          {templateNames.map((t, i) => {
            const Icon = [Plus, GitBranch, Coffee, Utensils][i];
            return (
              <button
                key={t}
                className="template-card"
                onClick={() => {
                  setTemplate(t);
                  setName(
                    t === "Café Rush"
                      ? "Morning Café Rush"
                      : t === "Blank Workflow"
                        ? "Untitled Simulation"
                        : t,
                  );
                  setModal(true);
                }}
              >
                <span className={`template-icon template-${i}`}>
                  <Icon size={22} />
                </span>
                <h3>{t}</h3>
                <p>
                  {
                    [
                      "Build your process from the ground up.",
                      "One queue. A clear path to completion.",
                      "Orders, drinks, food, and pickup.",
                      "Explore serving and checkout capacity.",
                    ][i]
                  }
                </p>
                <span className="template-bottom">
                  {
                    [
                      "A clean canvas",
                      "2 connected steps",
                      "Parallel workflow",
                      "Service + checkout",
                    ][i]
                  }
                  <ArrowRight size={16} />
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <footer className="dashboard-footer">
        <span>
          <HardDriveIcon />
          Private by design. Your simulations stay in this browser.
        </span>
        <Link to="/about">
          About RushTwin <ArrowUpRight size={14} />
        </Link>
      </footer>
      {modal && (
        <Modal title="Create simulation" onClose={() => setModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <label>
              Project name
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                required
              />
            </label>
            <label>
              Template
              <select
                aria-label="Template"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                {templateNames.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              <button type="button" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="primary">Create Simulation</button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
function FlaskIcon() {
  return <Workflow size={16} />;
}
function HardDriveIcon() {
  return <span className="status-dot green" />;
}
