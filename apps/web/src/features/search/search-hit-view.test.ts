import { describe, expect, it } from "vitest";
import { hitRoute, splitContent } from "./search-hit-view";

describe("splitContent", () => {
  it("uses the first line as title and joins the rest", () => {
    expect(splitContent({ content: "Solvik\nGöteborg\ndaylight" })).toEqual({
      title: "Solvik",
      snippet: "Göteborg · daylight",
    });
  });

  it("handles single-line content", () => {
    expect(splitContent({ content: "Solvik" })).toEqual({ title: "Solvik", snippet: "" });
  });
});

describe("hitRoute", () => {
  it("links venues to their page and items to /items/[id]", () => {
    expect(hitRoute({ entityType: "venue", entityId: "v1" })).toBe("/venues/v1");
    expect(hitRoute({ entityType: "item", entityId: "i 1" })).toBe("/items/i%201");
  });
});
