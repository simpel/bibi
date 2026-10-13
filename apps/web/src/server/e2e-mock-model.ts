// E2E ONLY. A scripted language model for the Playwright suite (ADR 0007: the approval flow is
// tested "with a mocked model"). It is imported dynamically from `assistant-handlers.ts` and only
// when `E2E_MOCK_MODEL` is on outside production (`mock-model-policy.ts`). Never use it elsewhere.
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";

type DoStreamOptions = Parameters<MockLanguageModelV4["doStream"]>[0];
type StreamResult = Awaited<ReturnType<MockLanguageModelV4["doStream"]>>;
type Prompt = DoStreamOptions["prompt"];

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

const finish = ({ reason }: { reason: "stop" | "tool-calls" }) => ({
  type: "finish" as const,
  finishReason: { unified: reason, raw: undefined },
  usage,
});

const textStep = ({ text }: { text: string }): StreamResult => ({
  stream: simulateReadableStream({
    chunks: [
      { type: "text-start" as const, id: "t1" },
      { type: "text-delta" as const, id: "t1", delta: text },
      { type: "text-end" as const, id: "t1" },
      finish({ reason: "stop" }),
    ],
  }),
});

type ToolStepInput = { toolName: string; input: Record<string, unknown> };

const toolStep = ({ toolName, input }: ToolStepInput): StreamResult => ({
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

type PromptInput = { prompt: Prompt };

const lastUserText = ({ prompt }: PromptInput): string => {
  const user = [...prompt].reverse().find((message) => message.role === "user");
  if (!user || typeof user.content === "string") return "";
  return user.content.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n");
};

const endsWithToolResult = ({ prompt }: PromptInput): boolean =>
  prompt[prompt.length - 1]?.role === "tool";

/** Script: "create venue <name>", "list venues", "list skills"; anything else gets a canned reply. */
function respond({ prompt }: PromptInput): StreamResult {
  if (endsWithToolResult({ prompt })) return textStep({ text: "Klart. Se resultatet ovan." });
  const text = lastUserText({ prompt }).trim();
  const create = /create venue (.+)/i.exec(text);
  if (create?.[1]) return toolStep({ toolName: "venue_create", input: { name: create[1].trim() } });
  if (/list venues/i.test(text)) return toolStep({ toolName: "venue_list", input: {} });
  if (/list skills/i.test(text)) return toolStep({ toolName: "skill_list", input: {} });
  return textStep({ text: "Jag är en skriptad testassistent. Prova: create venue Test Hall." });
}

export function createE2eMockModel(): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    modelId: "e2e-mock-model",
    doStream: async ({ prompt }) => respond({ prompt }),
  });
}
