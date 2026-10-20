import type { Scenario } from "../types/model";
export function validateWorkflow(s: Scenario) {
  const errors: string[] = [],
    warnings: string[] = [];
  const ids = new Set(s.stations.map((n) => n.id));
  if (ids.size !== s.stations.length)
    errors.push("Station IDs must be unique.");
  const entries = s.stations.filter((n) => n.kind === "entry"),
    exits = s.stations.filter((n) => n.kind === "exit");
  if (entries.length !== 1 || exits.length !== 1)
    errors.push("Add exactly one Customers entry and one Complete exit.");
  if (!s.stations.some((n) => n.kind === "station"))
    errors.push("Add at least one processing station.");
  for (const n of s.stations.filter((n) => n.kind === "station")) {
    if (!Number.isInteger(n.workers) || n.workers < 0 || n.workers > 100)
      errors.push(`${n.name}: workers must be an integer from 0 to 100.`);
    if (n.workers === 0)
      warnings.push(
        `${n.name} has zero workers. Orders reaching this station will remain queued.`,
      );
    if (
      !Number.isFinite(n.service.mean) ||
      n.service.mean <= 0 ||
      !Number.isFinite(n.service.variation) ||
      n.service.variation < 0
    )
      errors.push(
        `${n.name}: processing time must be positive and variation nonnegative.`,
      );
  }
  const adj = new Map(
    s.stations.map((n) => [
      n.id,
      s.links.filter((e) => e.source === n.id).map((e) => e.target),
    ]),
  );
  if (
    new Set(s.links.map((e) => `${e.source}:${e.target}`)).size !==
    s.links.length
  )
    errors.push("Duplicate connections are not supported.");
  for (const e of s.links)
    if (!ids.has(e.source) || !ids.has(e.target))
      errors.push("A connection refers to a missing station.");
  if (
    s.links.some(
      (e) =>
        entries.some((n) => n.id === e.target) ||
        exits.some((n) => n.id === e.source),
    )
  )
    errors.push(
      "Customers cannot have incoming connections and Complete cannot have outgoing connections.",
    );
  if (new Set(s.orderTypes.map((t) => t.id)).size !== s.orderTypes.length)
    errors.push("Order type IDs must be unique.");
  const visiting = new Set<string>(),
    done = new Set<string>();
  let cycle = false;
  function visit(id: string) {
    if (visiting.has(id)) {
      cycle = true;
      return;
    }
    if (done.has(id)) return;
    visiting.add(id);
    for (const next of adj.get(id) ?? []) visit(next);
    visiting.delete(id);
    done.add(id);
  }
  s.stations.forEach((n) => visit(n.id));
  if (cycle)
    errors.push(
      "Your workflow contains a cycle. Cyclic workflows are not supported.",
    );
  function reaches(
    from: string,
    to: string,
    seen = new Set<string>(),
  ): boolean {
    if (from === to) return true;
    if (seen.has(from)) return false;
    seen.add(from);
    return (adj.get(from) ?? []).some((n) => reaches(n, to, seen));
  }
  if (entries[0] && exits[0])
    for (const n of s.stations) {
      if (!reaches(entries[0].id, n.id))
        errors.push(`${n.name} cannot be reached from Customers.`);
      if (!reaches(n.id, exits[0].id))
        errors.push(`${n.name} has no path to Complete.`);
    }
  if (
    !s.orderTypes.length ||
    Math.abs(s.orderTypes.reduce((a, t) => a + t.weight, 0) - 100) > 0.001
  )
    errors.push("Order type percentages must total 100%.");
  for (const t of s.orderTypes) {
    if (t.weight < 0 || !Number.isFinite(t.weight))
      errors.push(`${t.name}: invalid percentage.`);
    if (
      t.stations.some(
        (id) => !s.stations.some((n) => n.id === id && n.kind === "station"),
      )
    )
      errors.push(`${t.name} references a missing station.`);
    if (!t.stations.length)
      errors.push(`${t.name} needs at least one processing station.`);
  }
  if (
    !Number.isFinite(s.demand.duration) ||
    s.demand.duration <= 0 ||
    s.demand.duration > 86400
  )
    errors.push("Duration must be between 0 and 24 hours.");
  if (!Number.isInteger(s.demand.seed)) errors.push("Seed must be an integer.");
  if (
    !Number.isFinite(s.demand.rate) ||
    s.demand.rate < 0 ||
    s.demand.rate > 10000
  )
    errors.push("Arrival rate must be between 0 and 10,000/hour.");
  let end = 0;
  for (const i of s.demand.mode === "schedule" ? s.demand.intervals : []) {
    if (
      !Number.isFinite(i.start) ||
      !Number.isFinite(i.end) ||
      i.start < end ||
      i.end <= i.start ||
      i.end > s.demand.duration ||
      i.rate < 0 ||
      !Number.isFinite(i.rate)
    )
      errors.push(
        "Rush intervals must be ordered, non-overlapping, within duration, and have nonnegative rates.",
      );
    end = i.end;
  }
  if (s.demand.mode === "imported" && !s.replay)
    errors.push("Import arrival data before running an imported replay.");
  return { errors: [...new Set(errors)], warnings };
}
// Contract omitted stations by following their predecessors. Selected tasks keep all upstream dependencies.
export function dependencies(s: Scenario, selected: string[]) {
  const selectedSet = new Set(selected);
  const result: Record<string, string[]> = {};
  for (const id of selected) {
    const found = new Set<string>(),
      seen = new Set<string>();
    function walk(target: string) {
      for (const e of s.links.filter((e) => e.target === target)) {
        if (seen.has(e.source)) continue;
        seen.add(e.source);
        if (selectedSet.has(e.source)) found.add(e.source);
        else walk(e.source);
      }
    }
    walk(id);
    result[id] = [...found];
  }
  return result;
}
