import type { Prisma } from "@okazi/db";
import { hasPermission, type Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { ENTITY_FEATURE } from "../../permissions/entity-features";
import type { PermissionSet } from "../../permissions/permission-set";

/**
 * Entity types whose audit images are private to the user who made the change: the caller's own
 * space (`self` in ENTITY_FEATURE: conversations, messages, skills, preferences, settings,
 * connected apps, change sets) and invitations (before/after images hold the invitee's email,
 * roles and `inviterId`).
 */
const PRIVATE_TYPES: readonly string[] = [
  ...Object.keys(ENTITY_FEATURE).filter((type) => ENTITY_FEATURE[type] === "self"),
  "invitation",
];

/** Private types an admin may still read for everyone, by the same rule as their list operation. */
const ADMIN_READABLE: Readonly<Record<string, Permission>> = {
  conversation: "assistant:read",
  message: "assistant:read",
  invitation: "member:write",
};

type TypesInput = { permissions: PermissionSet };

/** Known entity types the caller sees for everyone: their feature's `view`, or an admin rule. */
function sharedTypes({ permissions }: TypesInput): string[] {
  return Object.entries(ENTITY_FEATURE)
    .filter(([type, feature]) => {
      const adminRule = ADMIN_READABLE[type];
      if (adminRule) return hasPermission({ permissions, permission: adminRule });
      if (feature === "self" || PRIVATE_TYPES.includes(type)) return false;
      return hasPermission({ permissions, permission: `${feature}:read` });
    })
    .map(([type]) => type);
}

export type AuditVisibilityInput = { context: Pick<OperationContext, "actor" | "permissions"> };

/**
 * Per-user visibility on top of scopedDb (which already limits rows to the org), ADR 0050
 * "Feature scope": a row is shown only when the caller may view its entity type's feature
 * (ENTITY_FEATURE). Private types are shown only to the user who made the change, except that
 * `assistant:read` sees conversation rows (same rule as `conversation.list`) and `member:write`
 * sees invitation rows (same rule as `member.listInvitations`). Unknown entity types are hidden
 * (fail closed). System jobs see everything.
 */
export function visibleAuditWhere({ context }: AuditVisibilityInput): Prisma.AuditLogWhereInput {
  const { actor, permissions } = context;
  if (actor.type === "system") return {};
  const shared: Prisma.AuditLogWhereInput = {
    entityType: { in: sharedTypes({ permissions }) },
  };
  if (!actor.userId) return shared;
  const own = { entityType: { in: [...PRIVATE_TYPES] }, actorId: actor.userId };
  return { OR: [shared, own] };
}
