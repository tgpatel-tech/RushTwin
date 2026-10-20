import Dexie, { type EntityTable } from "dexie";
import type { Project, Run } from "../types/model";
export const db = new Dexie("RushTwin") as Dexie & {
  projects: EntityTable<Project, "id">;
  runs: EntityTable<Run, "id">;
};
db.version(1).stores({
  projects: "id,updatedAt",
  runs: "id,projectId,scenarioId,createdAt",
});
export const saveProject = (project: Project) =>
  db.projects.put(structuredClone(project));
export async function deleteProject(id: string) {
  await db.transaction("rw", db.projects, db.runs, async () => {
    await db.projects.delete(id);
    await db.runs.where("projectId").equals(id).delete();
  });
}
