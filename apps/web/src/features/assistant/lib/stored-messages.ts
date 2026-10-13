import type { MessageDto } from "@okazi/core";
import type { UIMessage } from "ai";

/** An approval decision stored as a TOOL message (`data-okazi-approval` part + result text). */
export type StoredDecision = {
  toolCallId: string;
  decision: "approved" | "rejected" | "failed";
  /** Operation output of an approved proposal (parsed from the note), when it still parses. */
  result: unknown;
};

export type StoredConversation = { messages: UIMessage[]; decisions: StoredDecision[] };

const RESULT_MARKER = "Result: ";
const DECISIONS = new Set(["approved", "rejected", "failed"]);

type PartInput = { message: MessageDto };

const parseResult = ({ message }: PartInput): unknown => {
  const text = message.parts.find((part) => part.type === "text")?.text ?? "";
  const at = text.indexOf(RESULT_MARKER);
  if (at < 0) return null;
  try {
    return JSON.parse(text.slice(at + RESULT_MARKER.length));
  } catch {
    return null;
  }
};

const toDecision = ({ message }: PartInput): StoredDecision | null => {
  const part = message.parts.find((candidate) => candidate.type === "data-okazi-approval");
  const data = (part as { data?: { toolCallId?: unknown; decision?: unknown } } | undefined)?.data;
  if (typeof data?.toolCallId !== "string" || !DECISIONS.has(String(data.decision))) return null;
  const decision = data.decision as StoredDecision["decision"];
  return { toolCallId: data.toolCallId, decision, result: parseResult({ message }) };
};

const textParts = ({ message }: PartInput) =>
  message.parts.flatMap((part) =>
    part.type === "text" && part.text ? [{ type: "text" as const, text: part.text }] : [],
  );

type ToUiInput = { message: MessageDto };

const toUiMessage = ({ message }: ToUiInput): UIMessage | null => {
  const { id } = message;
  if (message.role === "ASSISTANT") {
    return { id, role: "assistant", parts: message.parts as UIMessage["parts"] };
  }
  if (message.role !== "USER") return null;
  const parts = textParts({ message });
  return parts.length > 0 ? { id, role: "user", parts } : null;
};

export type ToStoredConversationInput = { messages: readonly MessageDto[] };

/** DB messages (oldest first) → what `useChat` shows, plus the stored approval decisions. */
export function toStoredConversation({ messages }: ToStoredConversationInput): StoredConversation {
  const ui = messages.flatMap((message) => toUiMessage({ message }) ?? []);
  const decisions = messages.flatMap((message) =>
    message.role === "TOOL" ? (toDecision({ message }) ?? []) : [],
  );
  return { messages: ui, decisions };
}
