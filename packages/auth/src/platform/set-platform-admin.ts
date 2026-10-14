import { getDb, PLATFORM_SCOPE } from "@okazi/db";
import { getLogger } from "@okazi/logger";
import { PLATFORM_ADMIN_ROLE } from "../plugins/admin";

export type SetPlatformAdminInput = { email: string; admin: boolean };

export type SetPlatformAdminOutput = { userId: string; role: string } | null;

/**
 * Grants or revokes the platform admin role (operators only, via the CLI). The change and the
 * AuditLog row (`PLATFORM_SCOPE`, actor SYSTEM) commit together.
 */
export async function setPlatformAdmin({
  email,
  admin,
}: SetPlatformAdminInput): Promise<SetPlatformAdminOutput> {
  const role = admin ? PLATFORM_ADMIN_ROLE : "user";
  const result = await getDb().$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { email }, select: { id: true, role: true } });
    if (!before) return null;
    await tx.user.update({ where: { id: before.id }, data: { role } });
    await tx.auditLog.create({
      data: {
        organizationId: PLATFORM_SCOPE,
        actorType: "SYSTEM",
        operation: admin ? "platformAdmin.grant" : "platformAdmin.revoke",
        entityType: "user",
        entityId: before.id,
        before: { role: before.role },
        after: { role },
        surface: "cli",
      },
    });
    return { userId: before.id, role };
  });
  const event = admin ? "platformAdmin.granted" : "platformAdmin.revoked";
  if (result) getLogger().info({ event, userId: result.userId });
  return result;
}
