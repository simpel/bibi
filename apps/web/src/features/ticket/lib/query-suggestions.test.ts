import { describe, expect, it } from "vitest";
import { applySuggestion, suggest } from "./query-suggestions";
import { EN_VOCABULARY, SV_VOCABULARY } from "./test-vocabularies";

const catalog = {
  status: ["Lead", "Offer", "Lost"],
  customer: ["Volvo Cars", "Kvarnby Design AB"],
};

const at = ({
  text,
  vocabulary = EN_VOCABULARY,
}: {
  text: string;
  vocabulary?: typeof EN_VOCABULARY;
}) => suggest({ text, caret: text.length, catalog, vocabulary });

describe("suggest", () => {
  it("offers qualifiers for a started word and all of them in an empty search", () => {
    expect(at({ text: "sta" }).items).toEqual([{ key: "status", label: "status:" }]);
    expect(at({ text: "" }).items.length).toBe(8);
    expect(at({ text: "volvo " }).items).toEqual([]);
  });

  it("offers qualifiers in the UI language, also for English or unaccented typing", () => {
    expect(at({ text: "ans", vocabulary: SV_VOCABULARY }).items).toEqual([
      { key: "assignee", label: "ansvarig:" },
    ]);
    expect(at({ text: "assig", vocabulary: SV_VOCABULARY }).items[0]?.label).toBe("ansvarig:");
    expect(at({ text: "fol", vocabulary: SV_VOCABULARY }).items[0]?.label).toBe("följare:");
  });

  it("offers the values of the qualifier being typed, starting matches first", () => {
    expect(at({ text: "status:lo" }).items).toEqual([
      { key: "status", value: "Lost", label: "Lost" },
    ]);
    expect(at({ text: "-status:Lead,o" }).items.map((item) => item.value)).toEqual([
      "Offer",
      "Lost",
    ]);
    expect(at({ text: "customer:" }).items).toHaveLength(2);
    expect(at({ text: "kund:vol", vocabulary: SV_VOCABULARY }).items[0]?.value).toBe("Volvo Cars");
  });

  it("keeps a quoted value with spaces as one word", () => {
    expect(at({ text: 'customer:"Volvo C' }).items[0]?.value).toBe("Volvo Cars");
  });

  it("stops once the value is complete or the qualifier is unknown", () => {
    expect(at({ text: "status:Lead" }).items).toEqual([]);
    expect(at({ text: "room:1" }).items).toEqual([]);
  });
});

describe("applySuggestion", () => {
  it("completes a qualifier in the UI language and keeps the minus", () => {
    const text = "kickoff -ans";
    const { token, items } = at({ text, vocabulary: SV_VOCABULARY });
    const suggestion = items[0] ?? { key: "assignee", label: "" };
    expect(applySuggestion({ text, token, suggestion })).toEqual({
      text: "kickoff -ansvarig:",
      caret: 18,
    });
  });

  it("completes a value after earlier ones, keeping the word as typed and quoting spaces", () => {
    const text = 'kund:"Kvarnby Design AB",vol';
    const { token } = at({ text, vocabulary: SV_VOCABULARY });
    const suggestion = { key: "customer", value: "Volvo Cars", label: "Volvo Cars" } as const;
    expect(applySuggestion({ text, token, suggestion }).text).toBe(
      'kund:"Kvarnby Design AB","Volvo Cars" ',
    );
  });
});
