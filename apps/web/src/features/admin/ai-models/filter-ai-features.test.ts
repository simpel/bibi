import { describe, expect, it } from "vitest";
import { filterAiFeatures, sortAiFeatures } from "./filter-ai-features";
import type { AiFeatureRow } from "./model-options";

const mockT = ((key: string) => {
  if (key === "features.assistantChat.name") return "Assistant";
  if (key === "features.assistantChat.description") return "Chat assistant";
  if (key === "features.orderTitle.name") return "Order title";
  if (key === "features.orderTitle.description") return "Names orders";
  return key;
}) as unknown as Parameters<typeof filterAiFeatures>[0]["t"];

const sampleRows: AiFeatureRow[] = [
  {
    setting: {
      id: "assistant.chat",
      modelType: "language",
      requiresReindex: false,
      modelId: "anthropic/claude-3-haiku",
      updatedAt: new Date("2026-01-01"),
      updatedBy: "user_1",
    },
    models: [
      {
        id: "anthropic/claude-3-haiku",
        name: "Haiku",
        provider: "Anthropic",
        type: "language",
        description: null,
        contextWindow: null,
        inputPrice: "0.25",
        outputPrice: "1.25",
        tags: [],
      },
    ],
  },
  {
    setting: {
      id: "order.title",
      modelType: "language",
      requiresReindex: false,
      modelId: "openai/gpt-4o-mini",
      updatedAt: new Date("2026-02-01"),
      updatedBy: "user_2",
    },
    models: [
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o mini",
        provider: "OpenAI",
        type: "language",
        description: null,
        contextWindow: null,
        inputPrice: "0.15",
        outputPrice: "0.6",
        tags: [],
      },
    ],
  },
];

describe("filterAiFeatures", () => {
  it("returns all rows when q is undefined", () => {
    expect(filterAiFeatures({ rows: sampleRows, q: undefined, t: mockT })).toEqual(sampleRows);
  });

  it("filters by feature name, description or model", () => {
    expect(filterAiFeatures({ rows: sampleRows, q: "assistant", t: mockT })).toHaveLength(1);
    expect(filterAiFeatures({ rows: sampleRows, q: "gpt-4o", t: mockT })).toHaveLength(1);
    expect(filterAiFeatures({ rows: sampleRows, q: "none", t: mockT })).toHaveLength(0);
  });
});

describe("sortAiFeatures", () => {
  it("sorts by feature name", () => {
    const asc = sortAiFeatures({ rows: sampleRows, sort: "feature", direction: "asc", t: mockT });
    expect(asc[0]?.setting.id).toBe("assistant.chat");

    const desc = sortAiFeatures({ rows: sampleRows, sort: "feature", direction: "desc", t: mockT });
    expect(desc[0]?.setting.id).toBe("order.title");
  });

  it("sorts by price", () => {
    const asc = sortAiFeatures({ rows: sampleRows, sort: "price", direction: "asc", t: mockT });
    expect(asc[0]?.setting.id).toBe("order.title");

    const desc = sortAiFeatures({ rows: sampleRows, sort: "price", direction: "desc", t: mockT });
    expect(desc[0]?.setting.id).toBe("assistant.chat");
  });
});
