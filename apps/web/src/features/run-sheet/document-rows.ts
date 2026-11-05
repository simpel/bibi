import type { DateTimeFormat, RunSheetChange, RunSheetDto, RunSheetRow } from "@bibi/core/schemas";

export type ChangeMark = RunSheetChange["change"] | null;

/** One thing to deliver: a line of the order, with the fields the run sheet includes. */
export type RunSheetTaskRow = {
  key: string;
  change: ChangeMark;
  /** ISO start, for sorting; null when the line has no time. */
  startsAt: string | null;
  when: string;
  name: string;
  item: string;
  quantity: number | null;
  /** An add-on to another row, or to a line that is not on this run sheet. */
  addOnTo: string | null;
  fields: Record<string, string>;
};

/** One counted need, e.g. Gluten × 5, on the whole order or on one line. */
export type RunSheetNeedRow = {
  key: string;
  change: ChangeMark;
  need: string;
  quantity: number | null;
  appliesTo: string;
};

export type DocumentRowsInput = {
  runSheet: Pick<RunSheetDto, "content" | "changes">;
  dates: DateTimeFormat;
  /** Shown for a need that counts for the whole order. */
  wholeOrder: string;
};

const text = ({ value }: { value: unknown }) =>
  value === null || value === undefined
    ? ""
    : Array.isArray(value)
      ? value.join(", ")
      : String(value);

const when = ({ row, dates }: { row: RunSheetRow; dates: DateTimeFormat }) =>
  row.startsAt && row.endsAt ? dates.dateTimeRange({ start: row.startsAt, end: row.endsAt }) : "";

/** A REMOVED change has no row left in the content; it is listed with what the change kept. */
const removedRow = ({ change }: { change: RunSheetChange }): RunSheetRow => ({
  kind: change.kind,
  key: change.key,
  parentKey: null,
  label: change.label,
  itemName: null,
  quantity: null,
  startsAt: null,
  endsAt: null,
  values: {},
});

/** The rows of a run sheet version as two tables: what to deliver, and the counted needs. */
export function documentRows({ runSheet, dates, wholeOrder }: DocumentRowsInput) {
  const marks = new Map(runSheet.changes.map((change) => [change.key, change.change]));
  const removed = runSheet.changes.filter((change) => change.change === "REMOVED");
  const rows = [...runSheet.content.rows, ...removed.map((change) => removedRow({ change }))];
  const names = new Map(rows.map((row) => [row.key, row.label]));
  const tasks: RunSheetTaskRow[] = rows
    .filter((row) => row.kind === "ITEM")
    .map((row) => ({
      key: row.key,
      change: marks.get(row.key) ?? null,
      startsAt: row.startsAt,
      when: when({ row, dates }),
      name: row.label,
      item: row.itemName ?? "",
      quantity: row.quantity,
      addOnTo: row.addOnTo ?? null,
      fields: Object.fromEntries(
        Object.entries(row.values).map(([key, value]) => [key, text({ value })]),
      ),
    }));
  const needs: RunSheetNeedRow[] = rows
    .filter((row) => row.kind === "REQUIREMENT")
    .map((row) => ({
      key: row.key,
      change: marks.get(row.key) ?? null,
      need: row.label,
      quantity: row.quantity,
      appliesTo: row.parentKey ? (names.get(row.parentKey) ?? "") : wholeOrder,
    }));
  return { tasks, needs };
}
