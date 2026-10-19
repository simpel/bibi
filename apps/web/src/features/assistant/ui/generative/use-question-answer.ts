import type { AskedQuestion } from "@okazi/ai";
import { isToolUIPart, type UIMessage } from "ai";
import { useContext } from "react";
import { answerText } from "../../lib/question-answer";
import { AssistantContext } from "../../state/assistant-context";

type LastAskedInput = { messages: readonly UIMessage[]; toolCallId: string | undefined };

/** The question is still open: it is in the last message, so nothing answered it yet. */
const isLastAsked = ({ messages, toolCallId }: LastAskedInput): boolean => {
  const last = messages.at(-1);
  if (!toolCallId || last?.role !== "assistant") return false;
  return last.parts.some((part) => isToolUIPart(part) && part.toolCallId === toolCallId);
};

export type UseQuestionAnswerInput = {
  question: Pick<AskedQuestion, "choices">;
  toolCallId: string | undefined;
};

/**
 * Whether the user can still answer, and `answer` that sends the answer as their next chat
 * message through `useChat` (nothing is saved by the questionnaire itself). Outside the chat
 * (e.g. a restored card without the provider) the question is read-only.
 */
export function useQuestionAnswer({ question, toolCallId }: UseQuestionAnswerInput) {
  const assistant = useContext(AssistantContext);
  const chat = assistant?.session.chat;
  const open =
    chat !== undefined &&
    chat.status === "ready" &&
    isLastAsked({ messages: chat.messages, toolCallId });
  const answer = ({ values }: { values: readonly string[] }) => {
    const text = answerText({ question, values });
    if (!open || text === "") return;
    void chat.sendMessage({ text });
  };
  return { open, answer };
}
