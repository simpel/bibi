import { isDeepStrictEqual } from "node:util";
import type { SheetChange, SheetContent, SheetRow } from "./schema";

const ATTRIBUTES = ["parentKey", "label", "itemName", "quantity", "startsAt", "endsAt"] as const;

type ChangedInput = { before: SheetRow; after: SheetRow };

/** Attributes and field keys whose value differs between two versions of the same row. */
function changedParts({ before, after }: ChangedInput): string[] {
  const attributes = ATTRIBUTES.filter((name) => !isDeepStrictEqual(before[name], after[name]));
  const keys = new Set([...Object.keys(before.values), ...Object.keys(after.values)]);
  const values = [...keys].filter(
    (key) => !isDeepStrictEqual(before.values[key], after.values[key]),
  );
  return [...attributes, ...values.sort()];
}

export type DiffContentInput = {
  /** The last sent version's content; null when nothing was sent before (nothing to mark). */
  before: SheetContent | null;
  after: SheetContent;
};

/**
 * The rows added, changed or removed since the last sent version (ADR 0021), in the order of the
 * new content, with removed rows last. Pure, so every surface shows the same markers.
 */
export function diffContent({ before, after }: DiffContentInput): SheetChange[] {
  if (!before) return [];
  const old = new Map(before.rows.map((row) => [row.key, row]));
  const current = new Set(after.rows.map((row) => row.key));
  const changes: SheetChange[] = [];
  for (const row of after.rows) {
    const previous = old.get(row.key);
    const base = { key: row.key, kind: row.kind, label: row.label };
    if (!previous) changes.push({ ...base, change: "ADDED", changed: [] });
    else {
      const changed = changedParts({ before: previous, after: row });
      if (changed.length > 0) changes.push({ ...base, change: "CHANGED", changed });
    }
  }
  for (const row of before.rows.filter(({ key }) => !current.has(key))) {
    changes.push({
      key: row.key,
      kind: row.kind,
      label: row.label,
      change: "REMOVED",
      changed: [],
    });
  }
  return changes;
}
