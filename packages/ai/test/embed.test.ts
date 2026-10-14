import { EMBEDDING_DIMENSIONS } from "@okazi/db";
import { MockEmbeddingModelV4 } from "ai/test";
import { describe, expect, it, vi } from "vitest";
import { createEmbed, isPlaceholderEmbed } from "../src/embeddings/create-embed";
import { PLACEHOLDER_EMBEDDING_MODEL } from "../src/embeddings/hash-embedding";

type MockInput = { dimensions?: number; maxEmbeddingsPerCall?: number };

const mockModel = ({ dimensions = EMBEDDING_DIMENSIONS, maxEmbeddingsPerCall = 100 }: MockInput) =>
  new MockEmbeddingModelV4({
    modelId: "mock-embedding",
    maxEmbeddingsPerCall,
    doEmbed: async ({ values }) => ({
      embeddings: values.map((_, index) => new Array<number>(dimensions).fill(index / 10)),
      warnings: [],
    }),
  });

describe("createEmbed", () => {
  it("embeds via the AI SDK in batches and reports the model id", async () => {
    const model = mockModel({});
    const embed = createEmbed({ model, maxBatchSize: 2 });
    const result = await embed({ texts: ["a", "b", "c"] });
    expect(result.model).toBe("mock-embedding");
    expect(result.embeddings).toHaveLength(3);
    expect(result.embeddings[0]).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(model.doEmbedCalls.map((call) => call.values.length)).toEqual([2, 1]);
    expect(isPlaceholderEmbed({ embed })).toBe(false);
  });

  it("fails fast with a clear error when the model returns another dimension", async () => {
    const embed = createEmbed({ model: mockModel({ dimensions: 768 }) });
    await expect(embed({ texts: ["a"] })).rejects.toMatchObject({
      code: "INTERNAL",
      message: expect.stringContaining("returned 768 dimensions, expected 1536"),
    });
  });

  it("falls back to the deterministic placeholder without a key outside production (warns once)", async () => {
    const warn = vi.fn();
    const embed = createEmbed({ apiKey: null, nodeEnv: "development", warn });
    createEmbed({ apiKey: null, nodeEnv: "development", warn });
    const first = await embed({ texts: ["Volvo hall"] });
    const second = await embed({ texts: ["Volvo hall"] });
    expect(first.model).toBe(PLACEHOLDER_EMBEDDING_MODEL);
    expect(first.embeddings[0]).toEqual(second.embeddings[0]);
    expect(first.embeddings[0]).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(isPlaceholderEmbed({ embed })).toBe(true);
    expect(warn.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it("refuses to embed in production without a key", async () => {
    const embed = createEmbed({ apiKey: null, nodeEnv: "production" });
    expect(isPlaceholderEmbed({ embed })).toBe(false);
    await expect(embed({ texts: ["x"] })).rejects.toMatchObject({ code: "INTERNAL" });
  });
});
