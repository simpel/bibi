import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { paginate } from "../../shared/paginate";
import { toJson } from "../../shared/to-json";
import { findConversation } from "../conversation/access";
import { checkAppendActor } from "./actor-rules";
import {
  MessageAppendInputSchema,
  MessageListInputSchema,
  MessageListOutputSchema,
  MessageSchema,
} from "./schema";

const ACTOR_TYPE = { user: "USER", ai: "AI", system: "SYSTEM" } as const;

const notFound = () =>
  err({ error: new AppError({ code: "NOT_FOUND", message: "Conversation not found" }) });

export const listMessages = defineOperation({
  name: "message.list",
  kind: "query",
  description:
    "List the messages of one of your conversations in order (oldest first). Parts follow the " +
    "AI SDK UIMessage parts shape.",
  input: MessageListInputSchema,
  output: MessageListOutputSchema,
  permission: "conversation:read",
  handler: async ({ input, context }) => {
    const id = input.conversationId;
    if (!(await findConversation({ context, id, access: "read" }))) return notFound();
    const rows = await context.db.message.findMany({
      where: { conversationId: id },
      orderBy: { sequence: "asc" },
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
    return ok({ value: paginate({ rows, limit: input.limit }) });
  },
});

export const appendMessage = defineOperation({
  name: "message.append",
  kind: "command",
  description:
    "Append a message (AI SDK UIMessage parts) to one of your conversations. The assistant may " +
    "only append ASSISTANT or TOOL messages to its own conversation.",
  input: MessageAppendInputSchema,
  output: MessageSchema,
  permission: "conversation:write",
  // Chat persistence, owner-only and append-only: no approval card for every turn.
  approval: false,
  handler: async ({ input, context }) => {
    const { actor } = context;
    const { conversationId, role } = input;
    const allowed = checkAppendActor({ actor, role, conversationId });
    if (!allowed.ok) return allowed;
    if (!(await findConversation({ context, id: conversationId, access: "own" }))) {
      return notFound();
    }
    // Updating the conversation row first locks it, so concurrent appends get distinct sequences.
    await context.db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    const last = await context.db.message.aggregate({
      where: { conversationId },
      _max: { sequence: true },
    });
    const message = await context.db.message.create({
      data: {
        organizationId: "",
        conversationId,
        sequence: (last._max.sequence ?? -1) + 1,
        role,
        parts: toJson({ value: input.parts }) ?? [],
        metadata: toJson({ value: input.metadata }) ?? {},
        actorType: ACTOR_TYPE[actor.type],
        createdBy: actor.userId,
      },
    });
    const after = { conversationId, role, sequence: message.sequence };
    context.recordChange({ entityId: message.id, after });
    return ok({ value: message });
  },
});

export const messageOperations = [listMessages, appendMessage];
