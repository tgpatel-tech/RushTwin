import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter, Routes, Route, Link } from "react-router-dom";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { Shell } from "./components/Shell";
import { Dashboard } from "./features/Dashboard";
const ProjectPage = lazy(() =>
  import("./features/Project").then((m) => ({ default: m.ProjectPage })),
);
const Compare = lazy(() =>
  import("./features/Compare").then((m) => ({ default: m.Compare })),
);
const ImportPage = lazy(() =>
  import("./features/Import").then((m) => ({ default: m.ImportPage })),
);
const Info = lazy(() =>
  import("./features/Info").then((m) => ({ default: m.Info })),
);
import "./styles.css";
const Router = import.meta.env.MODE === "github" ? HashRouter : BrowserRouter;

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="page">
        <h1>RushTwin could not render this view.</h1>
        <p>Your saved projects remain in browser storage. Reload to recover.</p>
        <button onClick={() => location.reload()}>Reload</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<div className="page">Loading workspace…</div>}>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<Dashboard />} />
              <Route path="project/:projectId" element={<ProjectPage />} />
              <Route path="project/:projectId/compare" element={<Compare />} />
              <Route
                path="project/:projectId/import"
                element={<ImportPage />}
              />
              <Route path="demo" element={<ProjectPage demo />} />
              <Route path="how-it-works" element={<Info />} />
              <Route path="about" element={<Info about />} />
              <Route
                path="*"
                element={
                  <main className="page">
                    <h1>Page not found</h1>
                    <Link to="/">Return to projects</Link>
                  </main>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  </React.StrictMode>,
);
