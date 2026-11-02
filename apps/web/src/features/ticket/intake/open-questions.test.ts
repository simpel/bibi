import { describe, expect, it } from "vitest";
import { answerQuestion, lowerToFit } from "./answer-question";
import { at, draftFixture, issueFixture, previewLineFixture } from "./line-fixture";
import { type OpenQuestionsInput, openQuestions } from "./open-questions";
import { type IntakeReview, newReview } from "./review-state";

const review = ({ patch = {} }: { patch?: Partial<IntakeReview> } = {}) => ({
  ...newReview({
    lines: [draftFixture({ from: 9, to: 11 })],
    plannedStart: at({ hour: 9 }).toISOString(),
    pickKey: "t1",
  }),
  ...patch,
});

const ask = ({ ...input }: Partial<OpenQuestionsInput> = {}) =>
  openQuestions({
    ...{ review: review(), start: at({ hour: 9 }), headcount: 10, planned: null },
    ticketType: null,
    ...input,
  });

const kinds = ({ ...input }: Partial<OpenQuestionsInput> = {}) =>
  ask(input).map(({ kind }) => kind);

describe("openQuestions", () => {
  it("asks nothing for a ready booking", () => {
    expect(ask()).toEqual([]);
  });

  it("asks what happens to the lines when the start moved, and moves or keeps them", () => {
    const [question] = ask({ start: at({ hour: 11 }) });
    expect(question).toMatchObject({ kind: "START_CHANGED", deltaMs: 2 * 3_600_000 });
    if (!question) throw new Error("no question");
    const moved = answerQuestion({ review: review(), question, answer: "MOVE_LINES" });
    expect(moved.lines?.[0]?.startsAt).toBe(at({ hour: 11 }).toISOString());
    const kept = answerQuestion({ review: review(), question, answer: "KEEP_TIMES" });
    expect(kept).toEqual({ plannedStart: at({ hour: 11 }).toISOString() });
  });

  it("asks before creating a lead without lines until it is accepted", () => {
    expect(kinds({ review: review({ patch: { lines: [] } }) })).toEqual(["NO_LINES"]);
    expect(kinds({ review: review({ patch: { lines: [], accepted: ["LEAD"] } }) })).toEqual([]);
  });

  it("asks about a line with quantity 0", () => {
    const lines = [draftFixture({ quantity: 0 })];
    expect(kinds({ review: review({ patch: { lines } }) })).toEqual(["ZERO_QUANTITY"]);
  });

  it("asks when choices or needs exceed the quantity, and lowers them to fit", () => {
    const options = [
      { itemId: "fish", quantity: 8 },
      { itemId: "veg", quantity: 4 },
    ];
    const needs = [{ entityTypeId: "rt", vocabularyValueId: "vegan", quantity: 11 }];
    const current = review({ patch: { lines: [draftFixture({ options, needs })] } });
    const questions = ask({ review: current });
    expect(questions.map((question) => question.kind === "OVER_QUANTITY" && question.what)).toEqual(
      ["CHOICES", "NEEDS"],
    );
    const [choices] = questions;
    if (!choices) throw new Error("no question");
    const fitted = answerQuestion({ review: current, question: choices, answer: "LOWER_TO_FIT" });
    expect(fitted.lines?.[0]?.options).toEqual([
      { itemId: "fish", quantity: 8 },
      { itemId: "veg", quantity: 2 },
    ]);
  });

  it("asks about choices that break a group's pick rule, answered by editing the line", () => {
    const snack = {
      ...{ name: "Snack", minPick: 1, maxPick: 1, split: false },
      options: [{ itemId: "cake" }, { itemId: "fruit" }, { itemId: "oat" }],
    };
    const items = [{ id: "i1", groups: [snack] }];
    const options = ["cake", "fruit", "oat"].map((itemId) => ({ itemId, quantity: null }));
    const current = review({
      patch: { lines: [draftFixture({ name: "Afternoon break", options })] },
    });
    expect(ask({ review: current, items })).toEqual([
      {
        ...{ kind: "OPTIONS", lineKey: "l1", name: "Afternoon break", group: "Snack", count: 3 },
        rule: { min: 1, max: 1, options: 3 },
      },
    ]);
    const one = review({ patch: { lines: [draftFixture({ options: options.slice(0, 1) })] } });
    expect(kinds({ review: one, items })).toEqual([]);
    expect(kinds({ items })).toEqual([]);
  });

  it("does not ask about extra picks, which are the line's add-ons (ADR 0088)", () => {
    const snack = {
      ...{ name: "Snack", minPick: 1, maxPick: 1, split: false, allowExtras: true },
      options: [{ itemId: "cake" }, { itemId: "fruit" }, { itemId: "oat" }],
    };
    const items = [{ id: "i1", groups: [snack] }];
    const extra = { itemId: "oat", quantity: null, unitPriceMinor: null };
    const addOns = [{ ...extra, key: "a1", name: "Oat ball", startsAt: null, endsAt: null }];
    const line = draftFixture({ options: [{ itemId: "cake", quantity: null }], addOns });
    expect(kinds({ review: review({ patch: { lines: [line] } }), items })).toEqual([]);
  });

  it("asks about a short pool until it is prebooked or lowered", () => {
    const short = issueFixture({ kind: "POOL_SHORT", needed: 12, free: 9 });
    const planned = [previewLineFixture({ from: 9, to: 11, issues: [short] })];
    const [question] = ask({ planned });
    expect(question).toMatchObject({ kind: "POOL_SHORT", needed: 12, free: 9 });
    if (!question) throw new Error("no question");
    const accepted = answerQuestion({ review: review(), question, answer: "PREBOOK" });
    expect(kinds({ planned, review: review({ patch: accepted }) })).toEqual([]);
    const lowered = answerQuestion({ review: review(), question, answer: "LOWER_TO_FREE" });
    expect(lowered.lines?.[0]?.quantity).toBe(9);
  });

  it("asks for a required ticket field and a package name", () => {
    const ticketType = { name: "Meeting", required: [{ key: "po", name: "PO number" }] };
    const saving = review({ patch: { saveAsPackage: true } });
    expect(kinds({ ticketType, review: saving })).toEqual(["TYPE_FIELD", "PACKAGE_NAME"]);
    const filled = review({ patch: { ticketFields: { po: "123" }, packageName: "Day" } });
    expect(kinds({ ticketType, review: { ...filled, saveAsPackage: true } })).toEqual([]);
  });

  it("turns a guessed value into a question until it is kept (ADR 0084)", () => {
    const guesses = [{ key: "guests.0", field: "guests", value: "12", step: "when" as const }];
    expect(kinds({ guesses })).toEqual(["GUESSED"]);
    const kept = review({ patch: { accepted: ["GUESS:guests.0"] } });
    expect(kinds({ guesses, review: kept })).toEqual([]);
  });
});

describe("lowerToFit", () => {
  it("lowers from the last count", () => {
    expect(lowerToFit({ counts: [5, 4, 3], limit: 6 })).toEqual([5, 1, 0]);
    expect(lowerToFit({ counts: [2], limit: 6 })).toEqual([2]);
  });
});
