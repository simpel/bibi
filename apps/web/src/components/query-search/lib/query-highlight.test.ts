import { describe, expect, it } from "vitest";
import { queryParts } from "./query-highlight";
import { SV_VOCABULARY } from "./test-vocabularies";

const parts = ({ text }: { text: string }) => queryParts({ text, vocabulary: SV_VOCABULARY });

describe("queryParts", () => {
  it("marks known qualifiers and their values, in either language", () => {
    expect(parts({ text: 'kickoff -ansvarig:jag status:"Lead, sen"' })).toEqual([
      { text: "kickoff ", kind: "plain" },
      { text: "-ansvarig:", kind: "key" },
      { text: "jag", kind: "value" },
      { text: " ", kind: "plain" },
      { text: "status:", kind: "key" },
      { text: '"Lead, sen"', kind: "value" },
    ]);
    expect(parts({ text: "assignee:me" }).map((part) => part.kind)).toEqual(["key", "value"]);
  });

  it("leaves unknown words, a bare qualifier and free text plain", () => {
    expect(parts({ text: "rum:12 status: volvo" })).toEqual([
      { text: "rum:12 status: volvo", kind: "plain" },
    ]);
  });

  it("joins back to the search", () => {
    const text = "  kund:volvo   när:2026-12 ";
    expect(
      parts({ text })
        .map((part) => part.text)
        .join(""),
    ).toBe(text);
  });
});
