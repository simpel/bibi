import { describe, expect, it } from "vitest";
import { answerQuestion } from "./answer-question";
import { choiceDefaults, choiceKeysOf, openChoiceCount, withChoices } from "./choice-lines";
import { reduceIntake } from "./intake-reducer";
import { type IntakeState, initialIntake } from "./intake-state";
import { draftFixture } from "./line-fixture";
import { openQuestions } from "./open-questions";
import { newReview } from "./review-state";

const snack = {
  ...{ name: "Snack", minPick: 1, maxPick: 1, split: false },
  options: [
    { itemId: "cake", name: "Carrot cake", priceEffect: "INCLUDED" as const },
    { itemId: "fruit", name: "Fresh fruit", priceEffect: "INCLUDED" as const },
  ],
};
const drink = { ...snack, name: "Drink", minPick: 0, options: [] };
const items = [{ id: "i1", groups: [snack, drink] }];

describe("the choices step (ADR 0089)", () => {
  it("asks only lines whose item has a required group", () => {
    const lines = [draftFixture({ key: "a" }), draftFixture({ key: "b", itemId: "other" })];
    expect(choiceKeysOf({ lines, items })).toEqual(["a"]);
  });

  it("replaces the required groups' options and the needs, and keeps the rest", () => {
    const line = draftFixture({ options: [{ itemId: "tea", quantity: null }] });
    const values = choiceDefaults({ line, groups: [snack, drink] });
    expect(values.groups[0]?.picked).toEqual([]);
    const next = withChoices({
      line,
      groups: [snack, drink],
      values: {
        groups: [
          { picked: ["fruit"], quantities: {} },
          { picked: [], quantities: {} },
        ],
        needs: [
          { valueId: "vegan", count: "2" },
          { valueId: "", count: "1" },
        ],
      },
      needTypeId: "need",
    });
    expect(next.options).toEqual([
      { itemId: "tea", quantity: null },
      { itemId: "fruit", quantity: null },
    ]);
    expect(next.needs).toEqual([{ entityTypeId: "need", vocabularyValueId: "vegan", quantity: 2 }]);
    expect(openChoiceCount({ lines: [line], items })).toBe(1);
    expect(openChoiceCount({ lines: [next], items })).toBe(0);
  });

  it("opens the step after a package with such lines, once", () => {
    const who = { customerId: "c", customerName: "C", contactId: "p", contactName: "P" };
    const when = { date: "2026-11-20", from: "09:00", to: "12:00", guests: 12 };
    const pick = { kind: "PACKAGE", templateId: "t1", name: "Day", answers: {} } as const;
    const start: IntakeState = { ...initialIntake({ intakeKey: "k" }), who, when, pick };
    const lines = [draftFixture({ key: "a" })];
    const action = { type: "completePackage", lines, plannedStart: null, choiceKeys: ["a"] };
    const first = reduceIntake({ state: start, action: action as never });
    expect(first.open).toBe("choices");
    const again = reduceIntake({ state: { ...first, open: "package" }, action: action as never });
    expect(again.open).toBe("review");
  });

  it("asks an open required group in review until it is left for later", () => {
    const line = draftFixture({ key: "a" });
    const review = newReview({ lines: [line], plannedStart: null, pickKey: "t1" });
    const input = { start: null, headcount: 10, planned: null, ticketType: null, items };
    const [question] = openQuestions({ ...input, review });
    expect(question).toMatchObject({ kind: "OPEN_CHOICE", lineKey: "a", group: "Snack" });
    if (!question) return;
    const patch = answerQuestion({ review, question, answer: "DECIDE_LATER" });
    expect(openQuestions({ ...input, review: { ...review, ...patch } })).toEqual([]);
  });
});
