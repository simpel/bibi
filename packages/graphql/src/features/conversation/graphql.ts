import {
  archiveConversation,
  type ConversationDto,
  ConversationSchema,
  createConversation,
  getConversation,
  listConversations,
  renameConversation,
} from "@okazi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const ConversationRef = objectFromSchema<ConversationDto>({
  name: "Conversation",
  schema: ConversationSchema,
  omit: ["organizationId"],
  description: "Assistant conversation, private to its owner (org admins may read).",
});
const ConversationPageRef = pageType({ name: "ConversationPage", item: ConversationRef });

fieldFromOperation({
  operation: listConversations,
  type: ConversationPageRef,
  name: "conversations",
});
fieldFromOperation({ operation: getConversation, type: ConversationRef, name: "conversation" });
mutationFromOperation({ operation: createConversation, type: ConversationRef });
mutationFromOperation({ operation: renameConversation, type: ConversationRef });
mutationFromOperation({ operation: archiveConversation, type: ConversationRef });
