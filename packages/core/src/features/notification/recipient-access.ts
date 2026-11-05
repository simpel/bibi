import { hasPermission, type Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { applyOverrides, type PermissionOverride } from "../../permissions/overrides";
import { parseMemberRole } from "../member/member-roles";
import type { NotificationKind } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type ReachableInput = Db & {
  userIds: readonly string[];
  kind: NotificationKind;
  /** What the recipient needs to see the subject and its snapshot, e.g. `order:read`. */
  needs: readonly Permission[];
};

/** The members' active permission overrides, by member id. */
async function overridesByMember({ context, memberIds }: Db & { memberIds: string[] }) {
  const rows = await context.db.permissionOverride.findMany({
    where: { subjectType: "MEMBER", subjectId: { in: memberIds }, status: "ACTIVE" },
  });
  const byMember = new Map<string, PermissionOverride[]>();
  for (const row of rows) {
    const effect = row.effect === "ALLOW" ? "allow" : "deny";
    const list = byMember.get(row.subjectId) ?? [];
    list.push({ feature: row.feature, action: row.action, effect } as PermissionOverride);
    byMember.set(row.subjectId, list);
  }
  return byMember;
}

/**
 * Who of `userIds` is told (ADR 0094): members of the organization who did not turn the kind
 * off and who may still see the subject (their preset plus overrides, as `packages/auth` resolves).
 */
export async function reachableRecipients({ context, userIds, kind, needs }: ReachableInput) {
  if (userIds.length === 0) return [];
  const [members, off] = await Promise.all([
    context.db.member.findMany({ where: { userId: { in: [...userIds] } } }),
    context.db.notificationPreference.findMany({
      where: { userId: { in: [...userIds] }, kind, enabled: false },
      select: { userId: true },
    }),
  ]);
  const disabled = new Set(off.map((row) => row.userId));
  const overrides = await overridesByMember({ context, memberIds: members.map((m) => m.id) });
  return members
    .filter((member) => !disabled.has(member.userId))
    .filter((member) => {
      const preset = parseMemberRole({ role: member.role });
      const permissions = applyOverrides({ preset, overrides: overrides.get(member.id) ?? [] });
      return needs.every((permission) => hasPermission({ permissions, permission }));
    })
    .map((member) => member.userId);
}
