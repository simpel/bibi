import { describe, expect, it } from "vitest";
import { draftKey, parseDraft, serializeDraft } from "./intake-draft";
import { INITIAL_INTAKE, type IntakeState } from "./intake-state";

const state: IntakeState = {
  open: "package",
  who: { customerId: "c1", customerName: "Volvo", contactId: "p1", contactName: "Anna" },
  when: { date: "2026-11-20", from: "09:00", to: "12:00", guests: 12 },
  pick: { kind: "PACKAGE", templateId: "t1", name: "Half day", answers: { clash: "PREBOOK" } },
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

  it("drops empty, broken and foreign drafts", () => {
    expect(parseDraft({ text: null })).toBeNull();
    expect(parseDraft({ text: "{not json" })).toBeNull();
    expect(parseDraft({ text: JSON.stringify({ version: 2, state }) })).toBeNull();
    expect(parseDraft({ text: serializeDraft({ state: INITIAL_INTAKE }) })).toBeNull();
  });
});
