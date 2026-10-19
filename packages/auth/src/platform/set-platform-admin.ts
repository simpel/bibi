import { SUPERADMIN_ROLE } from "@okazi/core";
import { getDb, PLATFORM_SCOPE } from "@okazi/db";
import { getLogger } from "@okazi/logger";

export type SetPlatformAdminInput = { email: string; admin: boolean };

export type SetPlatformAdminOutput = { userId: string; role: string } | null;

/**
 * Grants or revokes the superadmin role (operators only, via the CLI). The change and the
 * AuditLog row (`PLATFORM_SCOPE`, actor SYSTEM) commit together.
 */
export async function setPlatformAdmin({
  email,
  admin,
}: SetPlatformAdminInput): Promise<SetPlatformAdminOutput> {
  const role = admin ? SUPERADMIN_ROLE : "user";
  const result = await getDb().$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { email }, select: { id: true, role: true } });
    if (!before) return null;
    await tx.user.update({ where: { id: before.id }, data: { role } });
    await tx.auditLog.create({
      data: {
        organizationId: PLATFORM_SCOPE,
        actorType: "SYSTEM",
        operation: admin ? "superadmin.grant" : "superadmin.revoke",
        entityType: "user",
        entityId: before.id,
        before: { role: before.role },
        after: { role },
        surface: "cli",
      },
    });
    return { userId: before.id, role };
  });
  const event = admin ? "superadmin.granted" : "superadmin.revoked";
  if (result) getLogger().info({ event, userId: result.userId });
  return result;
}
