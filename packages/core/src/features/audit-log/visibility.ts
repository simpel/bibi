import type { Prisma } from "@okazi/db";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";

/**
 * Entity types whose audit images hold private content: assistant conversations and messages
 * (private to their owner, ADR 0007) and skills (personal skills are private to their owner).
 */
const PRIVATE_TYPES = ["conversation", "message", "skill"] as const;

/** Conversation admins may read everyone's conversations, so also their audit trail. */
const CONVERSATION_TYPES = ["conversation", "message"] as const;

export type AuditVisibilityInput = { context: Pick<OperationContext, "actor" | "permissions"> };

/**
 * Per-user visibility on top of scopedDb (which already limits rows to the org): rows on
 * private entity types are only visible to the user who made the change, except that
 * `conversation:admin` sees conversation rows (same rule as `conversation.list`). System jobs
 * see everything.
 */
export function visibleAuditWhere({ context }: AuditVisibilityInput): Prisma.AuditLogWhereInput {
  const { actor, permissions } = context;
  if (actor.type === "system") return {};
  const conversationAdmin = hasPermission({ permissions, permission: "conversation:admin" });
  const hidden = PRIVATE_TYPES.filter(
    (type) => !(conversationAdmin && (CONVERSATION_TYPES as readonly string[]).includes(type)),
  );
  return {
    OR: [
      { entityType: null },
      { entityType: { notIn: [...hidden] } },
      { actorId: actor.userId ?? "" },
    ],
  };
}
