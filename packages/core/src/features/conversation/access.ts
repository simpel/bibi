import type { Conversation } from "@okazi/db";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";

export type ConversationAccessInput = { context: Pick<OperationContext, "actor" | "permissions"> };

/**
 * Conversations are private to their owner. Org admins/owners (`conversation:admin`) and system
 * jobs may read everyone's (oversight: conversations hold business data), but only the owner
 * writes messages or renames.
 */
export function canReadAllConversations({ context }: ConversationAccessInput): boolean {
  if (context.actor.type === "system") return true;
  return hasPermission({ permissions: context.permissions, permission: "conversation:admin" });
}

/** `read`/`manage`: owner, admin or system. `own`: owner (or system) only. */
export type ConversationAccess = "read" | "manage" | "own";

export type FindConversationInput = {
  context: Pick<OperationContext, "actor" | "permissions" | "db">;
  id: string;
  access: ConversationAccess;
};

/** Loads an active conversation the actor may access; anything else is "not found". */
export async function findConversation({
  context,
  id,
  access,
}: FindConversationInput): Promise<Conversation | null> {
  const { actor } = context;
  const ownerOnly =
    actor.type !== "system" && (access === "own" || !canReadAllConversations({ context }));
  return context.db.conversation.findFirst({
    where: { id, ...(ownerOnly ? { ownerUserId: actor.userId ?? "" } : {}) },
  });
}
