import { appendMessage, listMessages, type MessageDto, MessageSchema } from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { type Page, pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { ConversationRef } from "../conversation/graphql";

export const MessageRef = objectFromSchema<MessageDto>({
  name: "Message",
  schema: MessageSchema,
  omit: ["organizationId"],
  description: "Chat message; `parts` are AI SDK UIMessage parts (JSON).",
});
const MessagePageRef = pageType({ name: "MessagePage", item: MessageRef });

fieldFromOperation({ operation: listMessages, type: MessagePageRef, name: "messages" });
mutationFromOperation({ operation: appendMessage, type: MessageRef });

// Graph edge. Goes through `message.list`, so the owner/admin rule of core applies here too.
builder.objectField(ConversationRef, "messages", (t) =>
  t.field({
    type: [MessageRef],
    description: "Messages in order (oldest first).",
    args: { limit: t.arg.int({ defaultValue: 100, description: "Max 200" }) },
    resolve: async (conversation, { limit }, ctx) => {
      const input = {
        conversationId: conversation.id,
        limit: Math.min(Math.max(limit ?? 100, 1), 200),
      };
      const page = (await runOperation({
        operation: listMessages,
        input,
        ctx,
      })) as Page<MessageDto>;
      return page.items;
    },
  }),
);
