import { describe, expect, it } from "vitest";
import { applySuggestion, suggest } from "./query-suggestions";

const catalog = {
  status: ["Lead", "Offer", "Lost"],
  customer: ["Volvo Cars", "Kvarnby Design AB"],
};

const at = ({ text }: { text: string }) => suggest({ text, caret: text.length, catalog });

describe("suggest", () => {
  it("offers qualifiers for a started word and all of them in an empty search", () => {
    expect(at({ text: "sta" }).items).toEqual([{ key: "status" }]);
    expect(at({ text: "" }).items.length).toBe(8);
    expect(at({ text: "volvo " }).items).toEqual([]);
  });

  it("offers the values of the qualifier being typed, starting matches first", () => {
    expect(at({ text: "status:lo" }).items).toEqual([{ key: "status", value: "Lost" }]);
    expect(at({ text: "-status:Lead,o" }).items.map((item) => item.value)).toEqual([
      "Offer",
      "Lost",
    ]);
    expect(at({ text: "customer:" }).items).toHaveLength(2);
  });

  it("keeps a quoted value with spaces as one word", () => {
    expect(at({ text: 'customer:"Volvo C' }).items).toEqual([
      { key: "customer", value: "Volvo Cars" },
    ]);
  });

  it("stops once the value is complete or the qualifier is unknown", () => {
    expect(at({ text: "status:Lead" }).items).toEqual([]);
    expect(at({ text: "room:1" }).items).toEqual([]);
  });
});

describe("applySuggestion", () => {
  it("completes a qualifier and keeps the minus", () => {
    const text = "kickoff -sta";
    const { token } = at({ text });
    expect(applySuggestion({ text, token, suggestion: { key: "status" } })).toEqual({
      text: "kickoff -status:",
      caret: 16,
    });
  });

  it("completes a value after earlier ones, quoting spaces", () => {
    const text = 'customer:"Kvarnby Design AB",vol';
    const { token } = suggest({ text, caret: text.length, catalog });
    const done = applySuggestion({
      text,
      token,
      suggestion: { key: "customer", value: "Volvo Cars" },
    });
    expect(done.text).toBe('customer:"Kvarnby Design AB","Volvo Cars" ');
  });
});
