import type { AiModel } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { groupByProvider, perMillion } from "./model-options";

const model = ({ id }: { id: string }): AiModel => ({
  id,
  name: id,
  provider: id.split("/")[0] ?? "",
  type: "language",
  description: null,
  contextWindow: null,
  inputPrice: null,
  outputPrice: null,
  tags: [],
});

describe("perMillion", () => {
  it("turns USD per token into USD per million tokens", () => {
    expect(perMillion({ price: "0.000002" })).toBeCloseTo(2);
    expect(perMillion({ price: null })).toBeNull();
    expect(perMillion({ price: "n/a" })).toBeNull();
  });
});

describe("groupByProvider", () => {
  it("keeps catalog order within and across providers", () => {
    const groups = groupByProvider({
      models: [model({ id: "a/1" }), model({ id: "a/2" }), model({ id: "b/1" })],
    });
    expect(groups.map((group) => [group.provider, group.models.length])).toEqual([
      ["a", 2],
      ["b", 1],
    ]);
  });
});
