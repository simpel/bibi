import { loadHours, replaceHours } from "../../hours/store";
import type { OperationContext } from "../../operations/types";
import { ensureMemberProfileId } from "../member-profile/load-member-profile";
import type { WorkingDay, WorkingHoursDto } from "./working-hours-schema";

const DAY_SELECT = {
  weekday: true,
  startMinute: true,
  endMinute: true,
  breakStartMinute: true,
  breakEndMinute: true,
} as const;

type Context = Pick<OperationContext, "db" | "organizationId">;

export type LoadWorkingHoursInput = { context: Context; userId: string };

/** The user's member profile here, if it was ever saved. */
const profileOf = ({ context, userId }: LoadWorkingHoursInput) =>
  context.db.memberProfile.findFirst({ where: { member: { userId } }, select: { id: true } });

/**
 * The user's working days in this organization (#449): the weekly pattern of their member
 * profile here, sorted by weekday. Another organization keeps its own.
 */
export async function loadWorkingHours({ context, userId }: LoadWorkingHoursInput) {
  const profile = await profileOf({ context, userId });
  if (!profile) return { days: [] } satisfies WorkingHoursDto;
  const days = await context.db.hoursDay.findMany({
    where: { memberProfileId: profile.id },
    orderBy: { weekday: "asc" },
    select: DAY_SELECT,
  });
  return { days } satisfies WorkingHoursDto;
}

export type ReplaceWorkingHoursInput = LoadWorkingHoursInput & { days: readonly WorkingDay[] };

/**
 * Replaces the user's working days here, keeping the dated exceptions. Runs in the command's
 * transaction with the profile locked (`replaceHours`), so concurrent replaces never merge.
 */
export async function replaceWorkingHours({ context, userId, days }: ReplaceWorkingHoursInput) {
  const member = await context.db.member.findFirst({ where: { userId }, select: { id: true } });
  if (!member) return { days: [] } satisfies WorkingHoursDto;
  const memberProfileId = await ensureMemberProfileId({ context, memberId: member.id });
  const owner = { memberProfileId };
  // The zone only labels the returned pattern; the minutes are wall-clock either way.
  const { exceptions } = await loadHours({ context, owner, timeZone: "" });
  await replaceHours({ context, owner, timeZone: "", pattern: { days: [...days], exceptions } });
  return loadWorkingHours({ context, userId });
}
