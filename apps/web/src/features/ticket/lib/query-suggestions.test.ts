import { describe, expect, it } from "vitest";
import type { QueryRemote } from "./query-suggestion-types";
import { applySuggestion, suggest } from "./query-suggestions";
import { EN_TEXTS, EN_VOCABULARY, SV_TEXTS, SV_VOCABULARY } from "./test-vocabularies";

const catalog = { status: ["Lead", "Offer", "Lost"] };
const remote: QueryRemote = {
  members: [{ userId: "u1", name: "Johan Ek", email: "johan@example.com", photoUrl: null }],
  customers: [{ id: "c1", name: "Volvo Cars" }],
};
const EN = { vocabulary: EN_VOCABULARY, texts: EN_TEXTS };
const SV = { vocabulary: SV_VOCABULARY, texts: SV_TEXTS };

const at = ({ text, lang = EN }: { text: string; lang?: typeof EN }) =>
  suggest({ text, caret: text.length, catalog, remote, ...lang });
const texts = ({ text, lang }: { text: string; lang?: typeof EN }) =>
  at({ text, ...(lang ? { lang } : {}) }).items.map((item) => item.text);

describe("suggest", () => {
  it("offers qualifiers by word or label, all of them in an empty search", () => {
    expect(at({ text: "as" }).items.map(({ label, text }) => [label, text])).toEqual([
      ["Assignee", "assignee:"],
    ]);
    expect(at({ text: "" }).items).toHaveLength(13);
    expect(at({ text: "volvo " }).items).toEqual([]);
    expect(texts({ text: "ans", lang: SV })).toEqual(["ansvarig:"]);
    expect(texts({ text: "assig", lang: SV })).toEqual(["ansvarig:"]);
  });

  it("opens people rows right after assignee: like GitHub", () => {
    expect(at({ text: "assignee:" }).items.map((item) => item.label)).toEqual([
      "No assignee",
      "Has assignee",
      "Me",
      "Exclude assignee",
      "Johan Ek",
    ]);
    expect(texts({ text: "kickoff ansvarig:", lang: SV })).toEqual([
      "saknar:ansvarig",
      "-saknar:ansvarig",
      "ansvarig:jag",
      "-ansvarig:",
      'ansvarig:"Johan Ek"',
    ]);
  });

  it("keeps only the rows that match what is typed, and the minus", () => {
    expect(texts({ text: "-assignee:jo" })).toEqual(['-assignee:"Johan Ek"']);
    expect(texts({ text: "follower:m" })).toEqual(["follower:me", 'follower:"Johan Ek"']);
  });

  it("offers catalog values and searched customers, starting matches first", () => {
    expect(texts({ text: "-status:Lead,o" })).toEqual(["-status:Lead,Offer", "-status:Lead,Lost"]);
    expect(texts({ text: "kund:vol", lang: SV })).toEqual(['kund:"Volvo Cars"']);
    expect(at({ text: "status:Lead" }).items).toEqual([]);
    expect(at({ text: "room:1" }).items).toEqual([]);
  });
});

describe("applySuggestion", () => {
  it("leaves a qualifier open and ends a value with a space", () => {
    const text = "kickoff as";
    const { token, items } = at({ text });
    const [first] = items;
    if (!first) throw new Error("no suggestion");
    expect(applySuggestion({ text, token, suggestion: first })).toEqual({
      text: "kickoff assignee:",
      caret: 17,
    });
    const after = at({ text: "assignee:jo" });
    const [member] = after.items;
    if (!member) throw new Error("no member");
    expect(
      applySuggestion({ text: "assignee:jo", token: after.token, suggestion: member }).text,
    ).toBe('assignee:"Johan Ek" ');
  });
});
