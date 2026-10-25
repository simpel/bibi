import type { OperationContext } from "../operations/types";
import { fromDateColumn, toDateColumn } from "../time/date-column";
import type { OpenSpan } from "./day-schema";
import type { HoursLookup } from "./within-hours";

type Owner = "venueId" | "itemId";

export type LoadLookupsInput = {
  context: Pick<OperationContext, "db">;
  owner: Owner;
  ids: readonly string[];
  /** Exceptions are read for these local dates only, `YYYY-MM-DD`, inclusive. */
  from: string;
  to: string;
};

const SPAN = {
  startMinute: true,
  endMinute: true,
  breakStartMinute: true,
  breakEndMinute: true,
} as const;

type Lookup = { days: Map<number, OpenSpan>; exceptions: Map<string, OpenSpan | null> };
type Row = { venueId: string | null; itemId: string | null } & OpenSpanRow;
type OpenSpanRow = { startMinute: number | null; endMinute: number | null } & Pick<
  OpenSpan,
  "breakStartMinute" | "breakEndMinute"
>;

const ownerOf = ({ row, owner }: { row: Pick<Row, "venueId" | "itemId">; owner: Owner }) =>
  (owner === "venueId" ? row.venueId : row.itemId) ?? "";

/** A row's span, or null for a closed day (no times). */
function spanOf({ row }: { row: OpenSpanRow }): OpenSpan | null {
  const { startMinute, endMinute, breakStartMinute, breakEndMinute } = row;
  if (startMinute === null || endMinute === null) return null;
  return { startMinute, endMinute, breakStartMinute, breakEndMinute };
}

type ReadInput = Omit<LoadLookupsInput, "from" | "to"> & { from: Date; to: Date };

/** Day rows, exceptions in the range, and which owners have any exception at all. */
function readRows({ context, owner, ids, from, to }: ReadInput) {
  const where = { [owner]: { in: [...ids] } };
  return Promise.all([
    context.db.hoursDay.findMany({
      where,
      select: { venueId: true, itemId: true, weekday: true, ...SPAN },
    }),
    context.db.hoursException.findMany({
      where: { ...where, date: { gte: from, lte: to } },
      select: { venueId: true, itemId: true, date: true, ...SPAN },
    }),
    context.db.hoursException.findMany({
      where,
      distinct: [owner],
      select: { venueId: true, itemId: true },
    }),
  ]);
}

/**
 * The patterns of many venues or items in two queries, by owner id. An owner with any row has a
 * pattern; with exceptions only, every other day is closed (ADR 0064 rule 10).
 */
export async function loadHoursLookups({ from, to, ...input }: LoadLookupsInput) {
  const lookups = new Map<string, Lookup>();
  if (input.ids.length === 0) return lookups as Map<string, HoursLookup>;
  const range = { from: toDateColumn({ date: from }), to: toDateColumn({ date: to }) };
  const [days, exceptions, withExceptions] = await readRows({ ...input, ...range });
  const ensure = ({ id }: { id: string }) => {
    const lookup = lookups.get(id) ?? { days: new Map(), exceptions: new Map() };
    lookups.set(id, lookup);
    return lookup;
  };
  for (const row of withExceptions) ensure({ id: ownerOf({ row, owner: input.owner }) });
  for (const row of days) {
    const span = spanOf({ row });
    if (span) ensure({ id: ownerOf({ row, owner: input.owner }) }).days.set(row.weekday, span);
  }
  for (const row of exceptions) {
    const lookup = ensure({ id: ownerOf({ row, owner: input.owner }) });
    lookup.exceptions.set(fromDateColumn({ value: row.date }), spanOf({ row }));
  }
  return lookups as Map<string, HoursLookup>;
}
