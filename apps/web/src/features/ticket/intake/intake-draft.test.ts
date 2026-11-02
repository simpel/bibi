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
  ...{ key: "l1", entityTypeId: "lt", name: "Room", itemId: "i1", setupId: null },
  ...{ startsAt: "2026-11-20T08:00:00.000Z", endsAt: "2026-11-20T10:00:00.000Z", quantity: null },
  ...{ unitPriceMinor: 1200, discountPercent: null, note: null, options: [], needs: [] },
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

  it("drops empty, broken and foreign drafts", () => {
    expect(parseDraft({ text: null })).toBeNull();
    expect(parseDraft({ text: "{not json" })).toBeNull();
    expect(parseDraft({ text: JSON.stringify({ version: 1, state }) })).toBeNull();
    expect(
      parseDraft({ text: serializeDraft({ state: initialIntake({ intakeKey: "k" }) }) }),
    ).toBeNull();
  });
});
