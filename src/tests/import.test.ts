import { it, expect } from "vitest";
import { parseCsv, validateCsv, timestamp } from "../persistence/csv";
import { projectSchema } from "../persistence/schema";
import { createProject, createScenario } from "../persistence/templates";
const mapping = {
  arrival: "arrival_time",
  id: "order_id",
  type: "order_type",
  completion: "",
  drinkStart: "",
  drinkEnd: "",
  foodStart: "",
  foodEnd: "",
};
it("imports normalized timestamps and validates invalid rows", () => {
  const p = parseCsv(
    "order_id,arrival_time,order_type\na,07:00:00,drink\nb,07:00:10,both\na,07:01:00,food\nc,wrong,both\nd,,drink\ne,07:00:12,nope",
  );
  const r = validateCsv(p.rows, mapping, createScenario().orderTypes);
  expect(r.arrivals.map((a) => a.time)).toEqual([0, 10]);
  expect(r.errors).toHaveLength(4);
});
it("detects malformed CSV", () =>
  expect(parseCsv('a,b\n"open').errors.length).toBeGreaterThan(0));
it("checks timestamp formats", () => {
  expect(timestamp("25:10")).toBeNull();
  expect(timestamp("2026-01-01T00:00:00Z")).toBeGreaterThan(0);
  expect(timestamp("12.5")).toBe(12.5);
});
it("validates project JSON and version", () => {
  expect(projectSchema.safeParse(createProject("Test")).success).toBe(true);
  expect(projectSchema.safeParse({ schemaVersion: 99 }).success).toBe(false);
});
