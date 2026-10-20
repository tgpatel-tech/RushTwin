import { z } from "zod";
const finite = z.number().finite();
const arrival = z.object({
  id: z.string().min(1).max(200),
  time: finite.nonnegative(),
  type: z.string().min(1),
});
const replay = z.object({
  seed: finite.int(),
  duration: finite.positive(),
  arrivals: z.array(arrival).max(10000),
});
const station = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  kind: z.enum(["entry", "station", "exit"]),
  workers: finite.int().min(0).max(100),
  service: z.object({
    kind: z.enum(["fixed", "uniform", "normal", "triangular"]),
    mean: finite.positive(),
    variation: finite.nonnegative(),
  }),
  position: z.object({ x: finite, y: finite }),
});
export const scenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  stations: z.array(station).max(100),
  links: z
    .array(z.object({ id: z.string(), source: z.string(), target: z.string() }))
    .max(500),
  orderTypes: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        weight: finite.min(0).max(100),
        stations: z.array(z.string()),
      }),
    )
    .min(1)
    .max(50),
  demand: z.object({
    mode: z.enum(["generated", "schedule", "imported"]),
    duration: finite.positive().max(86400),
    rate: finite.min(0).max(10000),
    seed: finite.int(),
    intervals: z
      .array(
        z.object({
          start: finite.nonnegative(),
          end: finite.positive(),
          rate: finite.min(0).max(10000),
        }),
      )
      .max(100),
  }),
  replay: replay.optional(),
});
export const projectSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1),
    name: z.string().min(1).max(120),
    updatedAt: finite,
    scenarios: z.array(scenarioSchema).min(1).max(50),
    activeScenarioId: z.string(),
  })
  .superRefine((p, ctx) => {
    if (
      !p.scenarios.some((s) => s.id === p.activeScenarioId) ||
      new Set(p.scenarios.map((s) => s.id)).size !== p.scenarios.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Invalid active scenario or duplicate scenario IDs.",
      });
  });
