import { convertToModelMessages, type ModelMessage, type ToolSet, type UIMessage } from "ai";

export type ToModelMessagesInput = { messages: UIMessage[]; tools: ToolSet };

const textOnly = ({ messages }: { messages: UIMessage[] }): UIMessage[] =>
  messages.flatMap((message) => {
    const parts = message.parts.filter((part) => part.type === "text");
    return parts.length > 0 ? [{ ...message, parts }] : [];
  });

/**
 * UI history → model messages. Stored tool parts from older runs may no longer convert (tool
 * renamed, schema drift); then the history degrades to its text instead of failing the turn.
 */
export async function toModelMessages({
  messages,
  tools,
}: ToModelMessagesInput): Promise<ModelMessage[]> {
  try {
    return await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true });
  } catch {
    return convertToModelMessages(textOnly({ messages }), { ignoreIncompleteToolCalls: true });
  }
}
