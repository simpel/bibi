import type { OperationContext } from "../operations/types";
import { fromDateColumn, toDateColumn } from "../time/date-column";
import type { HoursDto, HoursPattern } from "./schema";

/**
 * Whose hours: a venue's opening hours, an item's working hours (ADR 0064 rule 10) or a member's
 * working hours in this organization (#449).
 */
export type HoursOwner = { venueId: string } | { itemId: string } | { memberProfileId: string };

type Db = { context: Pick<OperationContext, "db" | "organizationId"> };

const SPAN = {
  startMinute: true,
  endMinute: true,
  breakStartMinute: true,
  breakEndMinute: true,
} as const;

export type LoadHoursInput = Db & { owner: HoursOwner; timeZone: string };

type Where = HoursOwner | { venueId: { in: string[] } };

/** The owners' day and exception rows in two queries, sorted for `toHoursDto`. */
function loadHourRows({ context, where }: Db & { where: Where }) {
  return Promise.all([
    context.db.hoursDay.findMany({
      where,
      orderBy: { weekday: "asc" },
      select: { weekday: true, venueId: true, ...SPAN },
    }),
    context.db.hoursException.findMany({
      where,
      orderBy: { date: "asc" },
      select: { date: true, note: true, venueId: true, ...SPAN },
    }),
  ]);
}

type HourRows = Awaited<ReturnType<typeof loadHourRows>>;

/** One owner's rows as its pattern, read in `timeZone`. */
function toHoursDto({ rows: [days, exceptions], timeZone }: { rows: HourRows; timeZone: string }) {
  return {
    days: days.map(({ venueId: _venue, ...day }) => day),
    exceptions: exceptions.map(({ date, venueId: _venue, ...row }) => ({
      date: fromDateColumn({ value: date }),
      ...row,
    })),
    timeZone,
  } satisfies HoursDto;
}

/** The owner's pattern: days by weekday, exceptions by date, with the zone they are read in. */
export async function loadHours({ context, owner, timeZone }: LoadHoursInput): Promise<HoursDto> {
  return toHoursDto({ rows: await loadHourRows({ context, where: owner }), timeZone });
}

export type LoadVenuesHoursInput = Db & { venues: { venueId: string; timeZone: string }[] };

/** Several venues' patterns in two queries, in the order given (ADR 0097: one read per page). */
export async function loadVenuesHours({ context, venues }: LoadVenuesHoursInput) {
  const venueIds = venues.map((venue) => venue.venueId);
  const [days, exceptions] = await loadHourRows({ context, where: { venueId: { in: venueIds } } });
  return venues.map(({ venueId, timeZone }) => {
    const rows: HourRows = [
      days.filter((day) => day.venueId === venueId),
      exceptions.filter((row) => row.venueId === venueId),
    ];
    return { venueId, hours: toHoursDto({ rows, timeZone }) };
  });
}

export type ReplaceHoursInput = LoadHoursInput & { pattern: HoursPattern };

/**
 * Takes the owner's row lock for the rest of the transaction, so concurrent replaces of one
 * owner's pattern run one after the other instead of merging (READ COMMITTED would let a second
 * delete miss the first one's new rows).
 */
async function lockOwner({ context, owner }: Db & { owner: HoursOwner }) {
  const data = { updatedAt: new Date() };
  if ("venueId" in owner) await context.db.venue.updateMany({ where: { id: owner.venueId }, data });
  else if ("itemId" in owner)
    await context.db.item.updateMany({ where: { id: owner.itemId }, data });
  else await context.db.memberProfile.updateMany({ where: { id: owner.memberProfileId }, data });
}

/** Replaces the owner's whole pattern in the command's transaction, one replace at a time. */
export async function replaceHours({ context, owner, timeZone, pattern }: ReplaceHoursInput) {
  const organizationId = context.organizationId;
  await lockOwner({ context, owner });
  await context.db.hoursDay.deleteMany({ where: owner });
  await context.db.hoursException.deleteMany({ where: owner });
  await context.db.hoursDay.createMany({
    data: pattern.days.map((day) => ({ ...day, ...owner, organizationId })),
  });
  await context.db.hoursException.createMany({
    data: pattern.exceptions.map(({ date, ...row }) => ({
      ...row,
      ...owner,
      organizationId,
      date: toDateColumn({ date }),
    })),
  });
  return loadHours({ context, owner, timeZone });
}
