// E2E ONLY. Building blocks of the scripted language model (`e2e-mock-model.ts`).
import { simulateReadableStream } from "ai";
import type { MockLanguageModelV4 } from "ai/test";

type DoStreamOptions = Parameters<MockLanguageModelV4["doStream"]>[0];
export type StreamResult = Awaited<ReturnType<MockLanguageModelV4["doStream"]>>;
export type Prompt = DoStreamOptions["prompt"];
export type PromptInput = { prompt: Prompt };

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

const finish = ({ reason }: { reason: "stop" | "tool-calls" }) => ({
  type: "finish" as const,
  finishReason: { unified: reason, raw: undefined },
  usage,
});

export const textStep = ({ text }: { text: string }): StreamResult => ({
  stream: simulateReadableStream({
    chunks: [
      { type: "text-start" as const, id: "t1" },
      { type: "text-delta" as const, id: "t1", delta: text },
      { type: "text-end" as const, id: "t1" },
      finish({ reason: "stop" }),
    ],
  }),
});

type ToolStepInput = { toolName: string; input: object };

export const toolStep = ({ toolName, input }: ToolStepInput): StreamResult => ({
  stream: simulateReadableStream({
    chunks: [
      {
        type: "tool-call" as const,
        toolCallId: `call_${toolName}_${Date.now()}`,
        toolName,
        input: JSON.stringify(input),
      },
      finish({ reason: "tool-calls" }),
    ],
  }),
});

export const lastUserText = ({ prompt }: PromptInput): string => {
  const user = [...prompt].reverse().find((message) => message.role === "user");
  if (!user || typeof user.content === "string") return "";
  return user.content.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n");
};

/** The tool whose result ends the prompt, or null when the prompt ends with another message. */
export const lastToolResult = ({ prompt }: PromptInput): string | null => {
  const last = prompt[prompt.length - 1];
  if (last?.role !== "tool") return null;
  const result = [...last.content].reverse().find((part) => part.type === "tool-result");
  return result && "toolName" in result ? result.toolName : "";
};

/** How often the model called a tool so far in the conversation. */
export const toolCallCount = ({ prompt, toolName }: PromptInput & { toolName: string }): number =>
  prompt
    .flatMap((message) =>
      message.role === "assistant" && Array.isArray(message.content) ? message.content : [],
    )
    .filter((part) => part.type === "tool-call" && part.toolName === toolName).length;

/** The system instructions of the run. */
export const systemText = ({ prompt }: PromptInput): string =>
  prompt.flatMap((message) => (message.role === "system" ? [message.content] : [])).join("\n");
