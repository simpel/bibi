import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { paginate } from "../../shared/paginate";
import { canReadAllConversations, findConversation } from "./access";
import { conversationEmbeddable } from "./embeddable";
import {
  ConversationCreateInputSchema,
  ConversationIdInputSchema,
  ConversationListInputSchema,
  ConversationListOutputSchema,
  ConversationRenameInputSchema,
  ConversationSchema,
} from "./schema";

const notFound = () =>
  err({ error: new AppError({ code: "NOT_FOUND", message: "Conversation not found" }) });

export const listConversations = defineOperation({
  name: "conversation.list",
  kind: "query",
  description:
    "List your assistant conversations, most recently active first. Org admins can pass " +
    "allUsers=true to include other users' conversations.",
  input: ConversationListInputSchema,
  output: ConversationListOutputSchema,
  permission: "conversation:read",
  handler: async ({ input, context }) => {
    if (input.allUsers && !canReadAllConversations({ context })) {
      const message = "Only organization admins can list other users' conversations";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const owner = input.allUsers ? {} : { ownerUserId: context.actor.userId ?? "" };
    const rows = await context.db.conversation.findMany({
      where: { status: input.status, ...owner },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
    return ok({ value: paginate({ rows, limit: input.limit }) });
  },
});

export const getConversation = defineOperation({
  name: "conversation.get",
  kind: "query",
  description: "Get one of your conversations by id (without messages; use message.list).",
  input: ConversationIdInputSchema,
  output: ConversationSchema,
  permission: "conversation:read",
  handler: async ({ input, context }) => {
    const conversation = await findConversation({ context, id: input.id, access: "read" });
    return conversation ? ok({ value: conversation }) : notFound();
  },
});

export const createConversation = defineOperation({
  name: "conversation.create",
  kind: "command",
  description: "Start a new assistant conversation owned by the current user.",
  input: ConversationCreateInputSchema,
  output: ConversationSchema,
  permission: "conversation:write",
  // Bookkeeping of the user's own chat; no approval card for the assistant creating it.
  approval: false,
  embeddable: conversationEmbeddable,
  handler: async ({ input, context }) => {
    const userId = context.actor.userId;
    if (!userId) {
      const message = "A conversation needs a user owner";
      return err({ error: new AppError({ code: "VALIDATION", message }) });
    }
    const conversation = await context.db.conversation.create({
      data: { title: input.title, ownerUserId: userId, organizationId: "", createdBy: userId },
    });
    context.recordChange({ entityId: conversation.id, after: conversation });
    return ok({ value: conversation });
  },
});

export const renameConversation = defineOperation({
  name: "conversation.rename",
  kind: "command",
  description: "Rename one of your conversations.",
  input: ConversationRenameInputSchema,
  output: ConversationSchema,
  permission: "conversation:write",
  approval: false,
  embeddable: conversationEmbeddable,
  handler: async ({ input, context }) => {
    const before = await findConversation({ context, id: input.id, access: "own" });
    if (!before) return notFound();
    const conversation = await context.db.conversation.update({
      where: { id: input.id },
      data: { title: input.title },
    });
    context.recordChange({ entityId: input.id, before, after: conversation });
    return ok({ value: conversation });
  },
});

export const archiveConversation = defineOperation({
  name: "conversation.archive",
  kind: "command",
  description: "Archive (soft-delete) a conversation. Owners and org admins can archive.",
  input: ConversationIdInputSchema,
  output: ConversationSchema,
  permission: "conversation:write",
  embeddable: conversationEmbeddable,
  handler: async ({ input, context }) => {
    const before = await findConversation({ context, id: input.id, access: "manage" });
    if (!before) return notFound();
    const conversation = await context.db.conversation.update({
      where: { id: input.id },
      data: { status: "ARCHIVED" },
    });
    context.recordChange({ entityId: input.id, before, after: conversation });
    return ok({ value: conversation });
  },
});

export const conversationOperations = [
  listConversations,
  getConversation,
  createConversation,
  renameConversation,
  archiveConversation,
];
