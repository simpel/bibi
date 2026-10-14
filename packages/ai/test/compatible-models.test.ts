import type { AiModel } from "@okazi/core";
import { afterEach, describe, expect, it } from "vitest";
import {
  clearGatewayModelCache,
  createListCompatibleModels,
  createListGatewayModels,
} from "../src/index";

type ModelInput = { id: string; type: AiModel["type"]; tags?: string[] };

const model = ({ id, type, tags = [] }: ModelInput): AiModel => ({
  id,
  name: id,
  provider: id.split("/")[0] ?? "",
  type,
  description: null,
  contextWindow: null,
  inputPrice: "0.000001",
  outputPrice: null,
  tags,
});

const catalog = [
  model({ id: "a/chat-tools", type: "language", tags: ["tool-use", "reasoning"] }),
  model({ id: "a/chat-plain", type: "language", tags: ["reasoning"] }),
  model({ id: "b/embed-1536", type: "embedding" }),
  model({ id: "b/embed-1024", type: "embedding" }),
  model({ id: "c/image", type: "image" }),
];

const probed: string[] = [];
const list = createListCompatibleModels({
  listModels: async () => catalog,
  probeEmbedding: async ({ modelId }) => {
    probed.push(modelId);
    return modelId.endsWith("1536");
  },
});

describe("createListCompatibleModels", () => {
  it("offers only tool-capable language models for the assistant, without probing", async () => {
    const ids = (await list({ feature: "assistant.chat" })).map((entry) => entry.id);
    expect(ids).toEqual(["a/chat-tools"]);
    expect(probed).toEqual([]);
  });

  it("offers only embedding models that pass the 1536-dimension probe", async () => {
    const ids = (await list({ feature: "search.embedding" })).map((entry) => entry.id);
    expect(ids).toEqual(["b/embed-1536"]);
    expect(probed).toEqual(["b/embed-1536", "b/embed-1024"]);
  });
});

afterEach(() => clearGatewayModelCache());

describe("createListGatewayModels", () => {
  it("drops batch-only and deprecated variants and keeps tags", async () => {
    const data = [
      { id: "x/live", type: "language", tags: ["tool-use"] },
      { id: "x/live-batch", type: "language", tags: ["tool-use"] },
      { id: "x/old", type: "language", deprecated_at: "2026-01-01" },
    ];
    const fetchFn = (async () => Response.json({ data })) as typeof fetch;
    const models = await createListGatewayModels({ fetchFn })();
    expect(models.map((entry) => [entry.id, entry.tags])).toEqual([["x/live", ["tool-use"]]]);
  });
});
