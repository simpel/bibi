import { SUPERADMIN_ROLE } from "@okazi/core";
import { getDb } from "@okazi/db";

export type IsPlatformAdminInput = { userId: string };

/**
 * Read live from the database on every call (like org roles), never from a cached session:
 * revoking the role takes effect on the next request. Banned users are never admins.
 */
export async function isPlatformAdmin({ userId }: IsPlatformAdminInput): Promise<boolean> {
  const user = await getDb().user.findUnique({
    where: { id: userId },
    select: { role: true, banned: true },
  });
  if (!user || user.banned) return false;
  const roles = (user.role ?? "").split(",").map((role) => role.trim());
  return roles.includes(SUPERADMIN_ROLE);
}
