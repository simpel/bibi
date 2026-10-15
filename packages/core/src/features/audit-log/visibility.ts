import type { Prisma } from "@okazi/db";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";

/**
 * Entity types whose audit images hold private content: assistant conversations and messages
 * (private to their owner, ADR 0007), skills (personal skills are private to their owner) and
 * invitations (before/after images hold the invitee's email, roles and `inviterId`).
 */
const PRIVATE_TYPES = ["conversation", "message", "skill", "invitation"] as const;

/** Conversation admins may read everyone's conversations, so also their audit trail. */
const CONVERSATION_TYPES = ["conversation", "message"] as const;

/** Member admins may read pending invitations (`member.listInvitations`), so also their audit trail. */
const INVITATION_TYPES = ["invitation"] as const;

export type AuditVisibilityInput = { context: Pick<OperationContext, "actor" | "permissions"> };

/**
 * Per-user visibility on top of scopedDb (which already limits rows to the org): rows on
 * private entity types are only visible to the user who made the change, except that
 * `conversation:admin` sees conversation rows (same rule as `conversation.list`) and
 * `member:admin` sees invitation rows (same rule as `member.listInvitations`). Skill rows have
 * no admin override. System jobs see everything.
 */
export function visibleAuditWhere({ context }: AuditVisibilityInput): Prisma.AuditLogWhereInput {
  const { actor, permissions } = context;
  if (actor.type === "system") return {};
  const conversationAdmin = hasPermission({ permissions, permission: "conversation:admin" });
  const memberAdmin = hasPermission({ permissions, permission: "member:admin" });
  const hidden = PRIVATE_TYPES.filter((type) => {
    if ((CONVERSATION_TYPES as readonly string[]).includes(type)) return !conversationAdmin;
    if ((INVITATION_TYPES as readonly string[]).includes(type)) return !memberAdmin;
    return true;
  });
  return {
    OR: [
      { entityType: null },
      { entityType: { notIn: [...hidden] } },
      { actorId: actor.userId ?? "" },
    ],
  };
}
