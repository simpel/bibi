import type { OperationContext } from "../operations/types";
import { fromDateColumn, toDateColumn } from "../time/date-column";
import type { OpenSpan } from "./day-schema";
import type { HoursLookup } from "./within-hours";

type Owner = "venueId" | "itemId" | "memberProfileId";

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
type OwnerColumns = {
  venueId: string | null;
  itemId: string | null;
  memberProfileId: string | null;
};
type OpenSpanRow = { startMinute: number | null; endMinute: number | null } & Pick<
  OpenSpan,
  "breakStartMinute" | "breakEndMinute"
>;

const ownerOf = ({ row, owner }: { row: OwnerColumns; owner: Owner }) => row[owner] ?? "";

const OWNER_SELECT = { venueId: true, itemId: true, memberProfileId: true } as const;

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
      select: { ...OWNER_SELECT, weekday: true, ...SPAN },
    }),
    context.db.hoursException.findMany({
      where: { ...where, date: { gte: from, lte: to } },
      select: { ...OWNER_SELECT, date: true, ...SPAN },
    }),
    context.db.hoursException.findMany({
      where,
      distinct: [owner],
      select: OWNER_SELECT,
    }),
  ]);
}

/**
 * The patterns of many owners in two queries, by owner id. An owner with any row has a pattern;
 * with exceptions only, every other day is closed (ADR 0064 rule 10).
 */
async function loadOwnerLookups({ from, to, ...input }: LoadLookupsInput) {
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

/**
 * The patterns of many venues or items, by id. A staff item linked to a member (ADR 0068) works
 * the member's hours here (#449): those are the only hours of a person, whatever position.
 */
export async function loadHoursLookups({ owner, ...rest }: LoadLookupsInput) {
  const input = { owner, ...rest };
  if (owner !== "itemId") return loadOwnerLookups(input);
  const links = await input.context.db.memberProfileItem.findMany({
    where: { itemId: { in: [...input.ids] } },
    select: { itemId: true, memberProfileId: true },
  });
  const profileOf = new Map(links.map((link) => [link.itemId, link.memberProfileId]));
  const free = input.ids.filter((id) => !profileOf.has(id));
  const [own, members] = await Promise.all([
    loadOwnerLookups({ ...input, ids: free }),
    loadOwnerLookups({ ...input, owner: "memberProfileId", ids: [...new Set(profileOf.values())] }),
  ]);
  for (const [itemId, profileId] of profileOf) {
    const lookup = members.get(profileId);
    if (lookup) own.set(itemId, lookup);
  }
  return own;
}
