import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

type FinishReason = "stop" | "tool-calls";

const finish = ({ reason }: { reason: FinishReason }) => ({
  type: "finish" as const,
  finishReason: { unified: reason, raw: undefined },
  usage,
});

/** One model step that answers with text. */
export function textStep({ text }: { text: string }) {
  return {
    stream: simulateReadableStream({
      chunks: [
        { type: "text-start" as const, id: "t1" },
        { type: "text-delta" as const, id: "t1", delta: text },
        { type: "text-end" as const, id: "t1" },
        finish({ reason: "stop" }),
      ],
    }),
  };
}

export type ToolStepInput = { toolName: string; input: Record<string, unknown>; id?: string };

/** One model step that calls a tool. */
export function toolStep({ toolName, input, id = `call_${toolName}` }: ToolStepInput) {
  return {
    stream: simulateReadableStream({
      chunks: [
        { type: "tool-call" as const, toolCallId: id, toolName, input: JSON.stringify(input) },
        finish({ reason: "tool-calls" }),
      ],
    }),
  };
}

export type MockModelInput = { steps: ReturnType<typeof textStep>[] };

/** Scripted model: step N of the run gets `steps[N]`. No network. */
export function mockModel({ steps }: MockModelInput): MockLanguageModelV4 {
  return new MockLanguageModelV4({ modelId: "mock-model", doStream: steps });
}

export type ToolNamesInput = { model: MockLanguageModelV4; call: number };

/** Names of the tools the model was offered in its N-th call. */
export function offeredTools({ model, call }: ToolNamesInput): string[] {
  const tools = model.doStreamCalls[call]?.tools ?? [];
  return tools.map((tool) => tool.name).sort();
}
