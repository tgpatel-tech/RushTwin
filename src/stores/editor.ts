import { create } from "zustand";
import type { Project, Scenario } from "../types/model";
import { saveProject } from "../persistence/db";
type Editor = {
  project: Project | null;
  past: Project[];
  future: Project[];
  saveStatus: string;
  load: (p: Project) => void;
  change: (fn: (p: Project) => void, history?: boolean) => void;
  edit: (fn: (s: Scenario) => void) => void;
  undo: () => void;
  redo: () => void;
  flush: () => Promise<void>;
};
let timer: ReturnType<typeof setTimeout> | undefined;
let pending = Promise.resolve();
function persist(p: Project) {
  pending = pending
    .catch(() => {})
    .then(async () => {
      await saveProject(p);
    });
  return pending;
}
export const useEditor = create<Editor>((set, get) => ({
  project: null,
  past: [],
  future: [],
  saveStatus: "Saved locally",
  load: (p) =>
    set({ project: p, past: [], future: [], saveStatus: "Saved locally" }),
  change: (fn, history = true) => {
    const current = get().project;
    if (!current) return;
    const next = structuredClone(current);
    fn(next);
    next.updatedAt = Date.now();
    set({
      project: next,
      past: history ? [...get().past.slice(-39), current] : get().past,
      future: history ? [] : get().future,
      saveStatus: "Saving…",
    });
    clearTimeout(timer);
    timer = setTimeout(() => {
      persist(next)
        .then(() => {
          if (get().project?.updatedAt === next.updatedAt)
            set({ saveStatus: "Saved locally" });
        })
        .catch(() => set({ saveStatus: "Save failed — export a backup" }));
    }, 350);
  },
  edit: (fn) =>
    get().change((p) =>
      fn(p.scenarios.find((s) => s.id === p.activeScenarioId)!),
    ),
  undo: () => {
    const past = get().past;
    if (!past.length) return;
    const current = get().project!;
    get().change((p) => Object.assign(p, past[past.length - 1]), false);
    set({ past: past.slice(0, -1), future: [current, ...get().future] });
  },
  redo: () => {
    const future = get().future;
    if (!future.length) return;
    const current = get().project!;
    get().change((p) => Object.assign(p, future[0]), false);
    set({ future: future.slice(1), past: [...get().past, current] });
  },
  flush: async () => {
    clearTimeout(timer);
    const p = get().project;
    if (p && get().saveStatus !== "Saved locally") {
      await persist(p);
      if (get().project?.updatedAt === p.updatedAt)
        set({ saveStatus: "Saved locally" });
    } else await pending;
  },
}));
