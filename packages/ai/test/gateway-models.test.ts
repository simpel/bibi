import { afterEach, describe, expect, it } from "vitest";
import { clearGatewayModelCache, createListGatewayModels } from "../src/index";

const catalog = {
  object: "list",
  data: [
    {
      id: "openai/text-embedding-3-small",
      name: "Text Embedding 3 Small",
      owned_by: "openai",
      type: "embedding",
      pricing: { input: "0.00000002" },
    },
    {
      id: "anthropic/claude-sonnet-5.5",
      name: "Claude Sonnet 5.5",
      owned_by: "anthropic",
      type: "language",
      context_window: 200000,
      pricing: { input: "0.000003", output: "0.000015" },
    },
    { id: "acme/hologram", type: "hologram" },
  ],
};

afterEach(() => clearGatewayModelCache());

describe("createListGatewayModels", () => {
  it("normalises the catalog, skips unknown types and caches", async () => {
    let calls = 0;
    const fetchFn = (async () => {
      calls++;
      return Response.json(catalog);
    }) as typeof fetch;
    const list = createListGatewayModels({ fetchFn });
    const models = await list();
    expect(models.map((model) => [model.id, model.type])).toEqual([
      ["anthropic/claude-sonnet-5.5", "language"],
      ["openai/text-embedding-3-small", "embedding"],
    ]);
    expect(models[0]).toMatchObject({ provider: "anthropic", contextWindow: 200000 });
    await list();
    expect(calls).toBe(1);
  });

  it("fails with INTERNAL when the gateway is down", async () => {
    const fetchFn = (async () => new Response("down", { status: 503 })) as typeof fetch;
    await expect(createListGatewayModels({ fetchFn })()).rejects.toMatchObject({
      code: "INTERNAL",
    });
  });
});
