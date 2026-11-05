import { ModelDraftSchema } from "@bibi/core";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createExtract } from "../src/extract/create-extract";
import { createE2eDraftModel, E2E_DRAFT } from "../src/extract/e2e-draft-model";

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};

const answering = ({ text }: { text: string }) =>
  new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: undefined },
      usage,
      warnings: [],
    }),
  });

const input = {
  feature: "order.intakeDraft" as const,
  instructions: "Read it.",
  prompt: JSON.stringify({ request: { text: "x" } }),
  schema: z.object({ name: z.string() }),
};

describe("createExtract (ADR 0084)", () => {
  it("returns the model's object through Output.object", async () => {
    const extract = createExtract({ model: answering({ text: '{"name":"Anna"}' }) });
    expect(await extract(input)).toEqual({ ok: true, value: { name: "Anna" } });
  });

  it("is UNAVAILABLE when the answer does not fit the schema", async () => {
    const extract = createExtract({ model: answering({ text: '{"other":1}' }) });
    const result = await extract(input);
    expect(result.ok ? null : result.error.code).toBe("UNAVAILABLE");
  });

  it("is UNAVAILABLE without a gateway key", async () => {
    const result = await createExtract({ apiKey: null })(input);
    expect(result.ok ? null : result.error.code).toBe("UNAVAILABLE");
  });

  it("the E2E model answers a draft that fits core's model schema", async () => {
    const extract = createExtract({ model: createE2eDraftModel() });
    const result = await extract({ ...input, schema: ModelDraftSchema });
    expect(result).toEqual({ ok: true, value: E2E_DRAFT });
  });
});
