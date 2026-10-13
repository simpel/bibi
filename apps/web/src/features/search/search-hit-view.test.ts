import { describe, expect, it } from "vitest";
import { splitContent } from "./search-hit-view";

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
