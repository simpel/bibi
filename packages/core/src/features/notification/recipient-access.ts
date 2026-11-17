import { hasPermission, type Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { resolveSubjectsAccess } from "../../permissions/resolve-subject";
import { parseMemberRole } from "../member/member-roles";
import type { NotificationKind } from "./schema";

type Db = { context: Pick<OperationContext, "db" | "organizationId"> };

export type ReachableInput = Db & {
  userIds: readonly string[];
  kind: NotificationKind;
  /** What the recipient needs to see the subject and its snapshot, e.g. `order:read`. */
  needs: readonly Permission[];
};

/**
 * Who of `userIds` is told (ADR 0094): members of the organization who did not turn the kind
 * off and who may still see the subject (their preset plus overrides, through the same `resolveSubjectsAccess` as `packages/auth`).
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
  const access = await resolveSubjectsAccess({
    db: context.db,
    organizationId: context.organizationId,
    subjectKind: "member",
    subjects: members.map((member) => ({
      id: member.id,
      preset: parseMemberRole({ role: member.role }),
    })),
  });
  return members
    .filter((member) => !disabled.has(member.userId))
    .filter((member) => {
      const permissions = access.get(member.id)?.permissions ?? {};
      return needs.every((permission) => hasPermission({ permissions, permission }));
    })
    .map((member) => member.userId);
}
