import type { FieldChange } from "./schema";

/** Bookkeeping, not something the user changes. */
const IGNORED = new Set([
  "id",
  "organizationId",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
  "archivedAt",
]);

type Json = unknown;

/** The value as a plain object, or null for anything else (arrays, dates, leaves). */
const asObject = ({ value }: { value: Json }): Record<string, Json> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)
    ? (value as Record<string, Json>)
    : null;

/** The id property of an array entry (`setupId`, `itemId`, `id`), so entries match by it. */
function keyOf({ entry }: { entry: Json }): string | null {
  const object = asObject({ value: entry });
  if (!object) return null;
  const key = Object.keys(object).find((name) => name === "id" || name.endsWith("Id"));
  return key && typeof object[key] === "string" ? key : null;
}

/** An array of keyed objects as an object by id, without the id itself; else unchanged. */
function keyed({ value }: { value: Json }): Json {
  if (!Array.isArray(value) || value.length === 0) return value;
  const keys = value.map((entry) => keyOf({ entry }));
  if (keys.some((key) => key === null)) return value;
  const entries = value.map((entry, index) => {
    const { [keys[index] as string]: id, ...rest } = entry as Record<string, Json>;
    return [id as string, rest] as const;
  });
  return Object.fromEntries(entries);
}

/** Leaf values by dot path; objects (and keyed arrays) are walked, other values are leaves. */
function flatten({ value, prefix }: { value: Json; prefix: string }): Map<string, Json> {
  const out = new Map<string, Json>();
  const walked = keyed({ value });
  const object = asObject({ value: walked });
  if (!object) {
    if (prefix) out.set(prefix, walked instanceof Date ? walked.toISOString() : walked);
    return out;
  }
  for (const [name, child] of Object.entries(object)) {
    if (!prefix && IGNORED.has(name)) continue;
    const path = prefix ? `${prefix}.${name}` : name;
    for (const [leaf, leafValue] of flatten({ value: child, prefix: path }))
      out.set(leaf, leafValue);
  }
  return out;
}

export type DiffRecordInput = { before?: unknown; after?: unknown };

/** The fields that differ between two records, by path, in the after record's order. */
export function diffRecord({ before, after }: DiffRecordInput): FieldChange[] {
  const old = flatten({ value: before ?? {}, prefix: "" });
  const next = flatten({ value: after ?? {}, prefix: "" });
  const paths = [...new Set([...next.keys(), ...old.keys()])];
  return paths
    .filter((path) => JSON.stringify(old.get(path)) !== JSON.stringify(next.get(path)))
    .map((path) => ({ path, before: old.get(path), after: next.get(path) }));
}
