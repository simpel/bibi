import { CONVERSATION_HEADER } from "@bibi/auth";
import {
  consumeStream,
  createUIMessageStream,
  createUIMessageStreamResponse,
  hasToolCall,
  isStepCount,
  type LanguageModel,
  type ModelMessage,
  streamText,
  toUIMessageStream,
} from "ai";
import { ASK_QUESTION_TOOL } from "../questions/ask-question-tool";
import { ASSISTANT_LIMITS } from "./assistant-limits";
import type { PreparedTools } from "./prepare-tools";

/** Response header with the conversation id (also sent as a transient data part). */
export const CONVERSATION_ID_HEADER = CONVERSATION_HEADER;
/** Transient UI stream data part: `{ type: "data-bibi-conversation", data: { conversationId, created } }`. */
export const CONVERSATION_DATA_PART = "data-bibi-conversation";

export type RunFinish = { parts: readonly unknown[]; finishReason: string | undefined };

export type StreamChatInput = {
  model: LanguageModel;
  instructions: string;
  messages: ModelMessage[];
  prepared: PreparedTools;
  conversation: { id: string; created: boolean };
  /** Logs a failure and returns the text the user sees (`streamFailure`). */
  onError: (error: unknown) => string;
  /** Runs once when the stream ends (also on error/disconnect): persist + close the MCP client. */
  onFinish: (input: RunFinish) => Promise<void>;
};

type StartModelInput = Pick<StreamChatInput, "model" | "instructions" | "messages" | "prepared">;

/** `streamText` with bounded steps, tokens and time; skill restriction applied per step. */
function startModel({ model, instructions, messages, prepared }: StartModelInput) {
  const { tools, restriction } = prepared;
  return streamText({
    model,
    instructions,
    messages,
    tools,
    // A question ends the turn: the user's answer is the next message.
    stopWhen: [isStepCount(ASSISTANT_LIMITS.maxSteps), hasToolCall(ASK_QUESTION_TOOL)],
    maxOutputTokens: ASSISTANT_LIMITS.maxOutputTokens,
    timeout: { totalMs: ASSISTANT_LIMITS.totalTimeoutMs, stepMs: ASSISTANT_LIMITS.stepTimeoutMs },
    prepareStep: () => {
      const activeTools = restriction.active();
      return activeTools ? { activeTools: [...activeTools] } : {};
    },
  });
}

/** The model run piped into an AI SDK UI message stream (SSE) with the conversation id. */
export function streamChat({
  model,
  instructions,
  messages,
  prepared,
  conversation,
  onError,
  onFinish,
}: StreamChatInput): Response {
  const result = startModel({ model, instructions, messages, prepared });
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const data = { conversationId: conversation.id, created: conversation.created };
      writer.write({ type: CONVERSATION_DATA_PART, data, transient: true });
      const ui = toUIMessageStream({
        stream: result.stream,
        sendReasoning: false,
        onError,
      });
      writer.merge(ui);
    },
    onError,
    onEnd: ({ responseMessage, finishReason }) =>
      onFinish({ parts: responseMessage.parts, finishReason }),
  });
  return createUIMessageStreamResponse({
    stream,
    headers: { [CONVERSATION_ID_HEADER]: conversation.id },
    // Drain a copy so persistence + MCP close happen even if the browser disconnects.
    consumeSseStream: ({ stream: copy }) => {
      void consumeStream({ stream: copy });
    },
  });
}
