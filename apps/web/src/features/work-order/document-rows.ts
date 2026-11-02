import type {
  DateTimeFormat,
  WorkOrderChange,
  WorkOrderDto,
  WorkOrderRow,
} from "@bibi/core/schemas";

export type ChangeMark = WorkOrderChange["change"] | null;

/** One thing to deliver: a line of the ticket, with the fields the work order includes. */
export type WorkOrderTaskRow = {
  key: string;
  change: ChangeMark;
  /** ISO start, for sorting; null when the line has no time. */
  startsAt: string | null;
  when: string;
  name: string;
  item: string;
  quantity: number | null;
  /** An add-on to another row, or to a line that is not on this work order. */
  addOnTo: string | null;
  fields: Record<string, string>;
};

/** One counted need, e.g. Gluten × 5, on the whole ticket or on one line. */
export type WorkOrderNeedRow = {
  key: string;
  change: ChangeMark;
  need: string;
  quantity: number | null;
  appliesTo: string;
};

export type DocumentRowsInput = {
  workOrder: Pick<WorkOrderDto, "content" | "changes">;
  dates: DateTimeFormat;
  /** Shown for a need that counts for the whole ticket. */
  wholeTicket: string;
};

const text = ({ value }: { value: unknown }) =>
  value === null || value === undefined
    ? ""
    : Array.isArray(value)
      ? value.join(", ")
      : String(value);

const when = ({ row, dates }: { row: WorkOrderRow; dates: DateTimeFormat }) =>
  row.startsAt && row.endsAt ? dates.dateTimeRange({ start: row.startsAt, end: row.endsAt }) : "";

/** A REMOVED change has no row left in the content; it is listed with what the change kept. */
const removedRow = ({ change }: { change: WorkOrderChange }): WorkOrderRow => ({
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

/** The rows of a work order version as two tables: what to deliver, and the counted needs. */
export function documentRows({ workOrder, dates, wholeTicket }: DocumentRowsInput) {
  const marks = new Map(workOrder.changes.map((change) => [change.key, change.change]));
  const removed = workOrder.changes.filter((change) => change.change === "REMOVED");
  const rows = [...workOrder.content.rows, ...removed.map((change) => removedRow({ change }))];
  const names = new Map(rows.map((row) => [row.key, row.label]));
  const tasks: WorkOrderTaskRow[] = rows
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
  const needs: WorkOrderNeedRow[] = rows
    .filter((row) => row.kind === "REQUIREMENT")
    .map((row) => ({
      key: row.key,
      change: marks.get(row.key) ?? null,
      need: row.label,
      quantity: row.quantity,
      appliesTo: row.parentKey ? (names.get(row.parentKey) ?? "") : wholeTicket,
    }));
  return { tasks, needs };
}
