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

/** The owner's pattern: days by weekday, exceptions by date, with the zone they are read in. */
export async function loadHours({ context, owner, timeZone }: LoadHoursInput): Promise<HoursDto> {
  const [days, rows] = await Promise.all([
    context.db.hoursDay.findMany({
      where: owner,
      orderBy: { weekday: "asc" },
      select: { weekday: true, ...SPAN },
    }),
    context.db.hoursException.findMany({
      where: owner,
      orderBy: { date: "asc" },
      select: { date: true, note: true, ...SPAN },
    }),
  ]);
  const exceptions = rows.map(({ date, ...row }) => ({
    date: fromDateColumn({ value: date }),
    ...row,
  }));
  return { days, exceptions, timeZone };
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
