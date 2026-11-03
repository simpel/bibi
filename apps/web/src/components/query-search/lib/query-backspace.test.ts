import { describe, expect, it } from "vitest";
import { withoutValueAt } from "./query-backspace";
import { EN_VOCABULARY, SV_VOCABULARY } from "./test-vocabularies";

describe("withoutValueAt", () => {
  it("removes a whole value, quoted or not, when the caret is right after it", () => {
    const text = 'assignee:"Lena Strand"';
    expect(withoutValueAt({ text, caret: text.length, vocabulary: EN_VOCABULARY })).toEqual({
      text: "assignee:",
      caret: 9,
    });
    const swedish = "ansvarig:jag status:Lead";
    expect(withoutValueAt({ text: swedish, caret: 12, vocabulary: SV_VOCABULARY })).toEqual({
      text: "ansvarig: status:Lead",
      caret: 9,
    });
  });

  it("leaves Backspace alone elsewhere: inside a value, after a space, on plain words", () => {
    const vocabulary = EN_VOCABULARY;
    expect(withoutValueAt({ text: "assignee:me", caret: 10, vocabulary })).toBeNull();
    expect(withoutValueAt({ text: "assignee:me ", caret: 12, vocabulary })).toBeNull();
    expect(withoutValueAt({ text: "assignee:", caret: 9, vocabulary })).toBeNull();
    expect(withoutValueAt({ text: "rum:12", caret: 6, vocabulary })).toBeNull();
  });
});
