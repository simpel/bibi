import { describe, expect, it } from "vitest";
import { draftKey, parseDraft, serializeDraft } from "./intake-draft";
import { type IntakeState, initialIntake } from "./intake-state";
import { newReview } from "./review-state";

const state: IntakeState = {
  open: "package",
  who: { customerId: "c1", customerName: "Volvo", contactId: "p1", contactName: "Anna" },
  when: { date: "2026-11-20", from: "09:00", to: "12:00", guests: 12 },
  pick: { kind: "PACKAGE", templateId: "t1", name: "Half day", answers: { clash: "PREBOOK" } },
  review: null,
  intakeKey: "k1",
};

const line = {
  ...{ key: "l1", entityTypeId: "lt", name: "Room", itemId: "i1", layoutId: null },
  ...{ startsAt: "2026-11-20T08:00:00.000Z", endsAt: "2026-11-20T10:00:00.000Z", quantity: null },
  ...{ unitPriceMinor: 1200, discountPercent: null, note: null, options: [], needs: [] },
  addOns: [],
  fields: { sign: "Volvo" },
};

describe("intake draft", () => {
  it("is kept per organization and member", () => {
    expect(draftKey({ organizationId: "o1", userId: "u1" })).not.toBe(
      draftKey({ organizationId: "o1", userId: "u2" }),
    );
  });

  it("reads back what it wrote", () => {
    expect(parseDraft({ text: serializeDraft({ state }) })).toEqual(state);
  });

  it("keeps the review with its lines", () => {
    const review = newReview({ lines: [line], plannedStart: line.startsAt, pickKey: "t1" });
    const reviewed = { ...state, open: "review" as const, review };
    expect(parseDraft({ text: serializeDraft({ state: reviewed }) })).toEqual(reviewed);
  });

  it("reads a version 2 draft, opening step 1 for the old step 0", () => {
    const old = { ...state, open: "message" };
    expect(parseDraft({ text: JSON.stringify({ version: 2, state: old }) })).toEqual({
      ...state,
      open: "who",
    });
  });

  it("reads a version 3 draft's lines with no add-ons (ADR 0088)", () => {
    const { addOns: _none, ...before } = line;
    const review = newReview({ lines: [line], plannedStart: line.startsAt, pickKey: "t1" });
    const old = { ...state, open: "review", review: { ...review, lines: [before] } };
    const parsed = parseDraft({ text: JSON.stringify({ version: 3, state: old }) });
    expect(parsed?.review?.lines).toEqual([line]);
  });

  it("keeps a read message before a customer is chosen", () => {
    const draft = {
      ...{ read: [], guesses: [], who: null, templateId: null, search: "Volvo", note: "" },
      when: { date: "", from: "", to: "", guests: "" },
    };
    const read = { ...initialIntake({ intakeKey: "k" }), draft };
    expect(parseDraft({ text: serializeDraft({ state: read }) })).toEqual(read);
  });

  it("drops empty, broken and foreign drafts", () => {
    expect(parseDraft({ text: null })).toBeNull();
    expect(parseDraft({ text: "{not json" })).toBeNull();
    expect(parseDraft({ text: JSON.stringify({ version: 1, state }) })).toBeNull();
    expect(
      parseDraft({ text: serializeDraft({ state: initialIntake({ intakeKey: "k" }) }) }),
    ).toBeNull();
  });
});
