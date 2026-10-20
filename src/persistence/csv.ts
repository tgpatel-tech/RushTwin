import Papa from "papaparse";
import type { Arrival, OrderType } from "../types/model";
export type CsvMapping = {
  arrival: string;
  id: string;
  type: string;
  completion: string;
  drinkStart: string;
  drinkEnd: string;
  foodStart: string;
  foodEnd: string;
};
export function parseCsv(text: string) {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
  });
  return {
    rows: parsed.data,
    fields: parsed.meta.fields ?? [],
    errors: parsed.errors.map((e) => `Row ${(e.row ?? 0) + 2}: ${e.message}`),
  };
}
export function timestamp(value: string): number | null {
  if (!value?.trim()) return null;
  const str = value.trim();
  if (/^\d+(\.\d+)?$/.test(str)) return Number(str);
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/.exec(str);
  if (m) {
    const [h, min, s] = [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
    return h < 24 && min < 60 && s < 60 ? h * 3600 + min * 60 + s : null;
  }
  if (/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(str)) {
    const n = Date.parse(str);
    return Number.isFinite(n) ? n / 1000 : null;
  }
  return null;
}
export function validateCsv(
  rows: Record<string, string>[],
  mapping: CsvMapping,
  types: OrderType[],
) {
  const errors: { row: number; message: string }[] = [],
    valid: Arrival[] = [];
  const seen = new Set<string>();
  for (const [i, row] of rows.entries()) {
    const issues: string[] = [],
      time = timestamp(row[mapping.arrival]),
      id =
        (mapping.id ? row[mapping.id]?.trim() : "") ||
        String(i + 1).padStart(3, "0"),
      rawType = mapping.type ? row[mapping.type]?.trim() : undefined,
      type = rawType
        ? types.find(
            (t) =>
              t.id.toLowerCase() === rawType.toLowerCase() ||
              t.name.toLowerCase() === rawType.toLowerCase(),
          )
        : types[0];
    if (time === null) issues.push("Invalid or blank arrival time");
    if (seen.has(id)) issues.push("Duplicate order ID");
    seen.add(id);
    if (!type) issues.push("Unknown order type");
    for (const [startKey, endKey, label] of [
      ["arrival", "completion", "Completion"],
      ["drinkStart", "drinkEnd", "Drink"],
      ["foodStart", "foodEnd", "Food"],
    ] as const) {
      const startColumn = mapping[startKey],
        endColumn = mapping[endKey];
      if (endColumn && row[endColumn]) {
        const end = timestamp(row[endColumn]),
          start = timestamp(row[startColumn]);
        if (end === null || start === null || end < start)
          issues.push(`${label} end is invalid or before start`);
      }
    }
    if (issues.length) errors.push({ row: i + 2, message: issues.join("; ") });
    else valid.push({ id, time: time!, type: type!.id });
  }
  valid.sort((a, b) => a.time - b.time);
  const origin = valid[0]?.time ?? 0;
  return {
    errors,
    arrivals: valid.map((a) => ({ ...a, time: a.time - origin })),
    origin,
  };
}
