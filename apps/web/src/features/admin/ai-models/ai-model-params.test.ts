import { describe, expect, it } from "vitest";
import { parseAiModelParams } from "./ai-model-params";

describe("parseAiModelParams", () => {
  it("reads search, page, pageSize, sort and dir", () => {
    const params = parseAiModelParams({
      params: { page: "2", pageSize: "50", sort: "price", dir: "desc", q: "chat" },
    });
    expect(params).toEqual({
      page: 2,
      pageSize: 50,
      sort: "price",
      direction: "desc",
      q: "chat",
    });
  });

  it("falls back to defaults on missing or invalid params", () => {
    const params = parseAiModelParams({
      params: { page: "-5", pageSize: "999", sort: "unknown" },
    });
    expect(params).toEqual({
      page: 1,
      pageSize: 25,
      sort: "feature",
      direction: "asc",
      q: undefined,
    });
  });
});
