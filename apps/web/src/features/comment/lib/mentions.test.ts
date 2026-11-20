import { describe, expect, it } from "vitest";
import { activeMention, insertMention, matchPeople, mentionedIds, splitMentions } from "./mentions";

const people = [
  { userId: "u1", name: "Anna Berg" },
  { userId: "u2", name: "Kim Lind" },
  { userId: "u3", name: "Anna Ek" },
];

describe("mentions (ADR 0115)", () => {
  it("finds the @name being typed only after white space", () => {
    expect(activeMention({ text: "Hi @An", caret: 6 })).toEqual({ start: 3, query: "An" });
    expect(activeMention({ text: "mail@host", caret: 9 })).toBeNull();
    expect(activeMention({ text: "@Kim\nok", caret: 7 })).toBeNull();
  });

  it("inserts the name and matches people by any word", () => {
    expect(insertMention({ text: "Hi @An!", start: 3, caret: 6, name: "Anna Berg" })).toEqual({
      text: "Hi @Anna Berg !",
      caret: 14,
    });
    expect(matchPeople({ people, query: "an" }).map((p) => p.userId)).toEqual(["u1", "u3"]);
    expect(matchPeople({ people, query: "lin" }).map((p) => p.userId)).toEqual(["u2"]);
  });

  it("keeps only the mentions still in the text and highlights them", () => {
    expect(mentionedIds({ text: "@Kim Lind and @Anna Berg", people })).toEqual(["u1", "u2"]);
    expect(splitMentions({ text: "Ask @Anna Berg now", names: ["Anna Berg"] })).toEqual([
      { text: "Ask ", mention: false },
      { text: "@Anna Berg", mention: true },
      { text: " now", mention: false },
    ]);
  });
});
