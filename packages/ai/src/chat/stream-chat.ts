import { CONVERSATION_HEADER } from "@okazi/auth";
import {
  consumeStream,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  type LanguageModel,
  type ModelMessage,
  streamText,
  toUIMessageStream,
} from "ai";
import { ASSISTANT_LIMITS } from "./assistant-limits";
import type { PreparedTools } from "./prepare-tools";

/** Response header with the conversation id (also sent as a transient data part). */
export const CONVERSATION_ID_HEADER = CONVERSATION_HEADER;
/** Transient UI stream data part: `{ type: "data-okazi-conversation", data: { conversationId, created } }`. */
export const CONVERSATION_DATA_PART = "data-okazi-conversation";

export type RunFinish = { parts: readonly unknown[]; finishReason: string | undefined };

export type StreamChatInput = {
  model: LanguageModel;
  instructions: string;
  messages: ModelMessage[];
  prepared: PreparedTools;
  conversation: { id: string; created: boolean };
  /** Runs once when the stream ends (also on error/disconnect): persist + close the MCP client. */
  onFinish: (input: RunFinish) => Promise<void>;
};

const SAFE_ERROR = "The assistant could not finish the answer. Please try again.";

type StartModelInput = Pick<StreamChatInput, "model" | "instructions" | "messages" | "prepared">;

/** `streamText` with bounded steps, tokens and time; skill restriction applied per step. */
function startModel({ model, instructions, messages, prepared }: StartModelInput) {
  const { tools, restriction } = prepared;
  return streamText({
    model,
    instructions,
    messages,
    tools,
    stopWhen: isStepCount(ASSISTANT_LIMITS.maxSteps),
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
        onError: () => SAFE_ERROR,
      });
      writer.merge(ui);
    },
    onError: () => SAFE_ERROR,
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
