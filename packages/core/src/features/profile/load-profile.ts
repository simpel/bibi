import type { OperationContext } from "../../operations/types";
import type { ProfileDto } from "./schema";

export const PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarKey: true,
} as const;

export type LoadProfileInput = { context: Pick<OperationContext, "db">; userId: string };

/**
 * The user's profile with `complete` derived on read (ADR 0061): first name, last name and phone
 * set and at least one working day. Without a row every field is null.
 */
export async function loadProfile({ context, userId }: LoadProfileInput): Promise<ProfileDto> {
  const [row, days] = await Promise.all([
    context.db.userProfile.findUnique({ where: { userId }, select: PROFILE_SELECT }),
    // Working days are kept per organization (#449): the ones here make the profile complete.
    context.db.hoursDay.count({ where: { memberProfile: { member: { userId } } } }),
  ]);
  const named = Boolean(row?.firstName && row.lastName && row.phone);
  return {
    id: row?.id ?? null,
    firstName: row?.firstName ?? null,
    lastName: row?.lastName ?? null,
    phone: row?.phone ?? null,
    avatarKey: row?.avatarKey ?? null,
    complete: named && days > 0,
  };
}
