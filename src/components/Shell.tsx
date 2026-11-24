import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  FlaskConical,
  BookOpen,
  HelpCircle,
  HardDrive,
  ChevronRight,
} from "lucide-react";
import { Logo } from "./Common";
import { useEditor } from "../stores/editor";
export function Shell() {
  const location = useLocation(),
    project = useEditor((s) => s.project),
    status = useEditor((s) => s.saveStatus),
    change = useEditor((s) => s.change);
  const inProject =
    location.pathname.startsWith("/project/") || location.pathname === "/demo";
  return (
    <div className={`app-shell ${inProject ? "editor-shell" : ""}`}>
      <aside className="sidebar">
        <NavLink to="/" aria-label="RushTwin home">
          <Logo /><span className="brand-label">RushTwin<small>Operations lab</small></span>
        </NavLink>
        <nav>
          <NavLink to="/" title="Dashboard" aria-label="Dashboard" end>
            <LayoutDashboard /><span>Overview</span>
          </NavLink>
          <NavLink
            to="/?view=projects"
            title="Projects"
            aria-label="Projects"
            className="project-nav"
          >
            <FolderOpen /><span>Simulations</span>
          </NavLink>
          <NavLink to="/demo" title="Demo rush" aria-label="Demo rush">
            <FlaskConical /><span>Café experiment</span>
          </NavLink>
          <NavLink
            to="/how-it-works"
            title="How it works"
            aria-label="How it works"
          >
            <BookOpen /><span>How it works</span>
          </NavLink>
        </nav>
        <NavLink
          to="/about"
          title="About and privacy"
          aria-label="About and privacy"
          className="sidebar-bottom"
        >
          <HelpCircle /><span>About & privacy</span>
        </NavLink>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumb">
            {inProject && project ? (
              <>
                <NavLink to="/">Projects</NavLink>
                <ChevronRight size={14} />
                <input
                  aria-label="Project name"
                  value={project.name}
                  maxLength={120}
                  onChange={(e) =>
                    change((p) => {
                      p.name = e.target.value || "Untitled Simulation";
                    })
                  }
                />
              </>
            ) : (
              <>
                <b>RushTwin</b>
                <span className="top-divider" />
                <span className="muted">Operations, made visible.</span>
              </>
            )}
          </div>
          <div className="top-right">
            <span className="save-status">
              <HardDrive size={14} />
              {inProject ? status : "Local workspace"}
            </span>
            <NavLink
              className="icon-button"
              to="/how-it-works"
              title="Help"
              aria-label="Help"
            >
              <HelpCircle size={18} />
            </NavLink>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
