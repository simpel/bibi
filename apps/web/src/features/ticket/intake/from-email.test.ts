import { describe, expect, it } from "vitest";
import { fromEmailSteps } from "./from-email";
import { type IntakeState, initialIntake } from "./intake-state";
import type { MessageDraft } from "./message-draft";

const who = { customerId: "c1", customerName: "Volvo", contactId: "p1", contactName: "Anna" };
const draft: MessageDraft = {
  ...{ read: [], guesses: [], who, templateId: "t1", search: null, note: "" },
  when: { date: "2026-11-20", from: "09:00", to: "12:00", guests: "12" },
};
const asRead: IntakeState = {
  ...initialIntake({ intakeKey: "k" }),
  draft,
  who,
  when: { date: "2026-11-20", from: "09:00", to: "12:00", guests: 12 },
  pick: { kind: "PACKAGE", templateId: "t1", name: "Half day", answers: {} },
};

describe("fromEmailSteps", () => {
  it("marks every step still as the message said", () => {
    expect(fromEmailSteps({ state: asRead })).toEqual(["who", "when", "package"]);
  });

  it("drops the mark of a changed value, and has none without a read", () => {
    const changed: IntakeState = {
      ...asRead,
      who: { ...who, contactId: "p2" },
      when: { date: "2026-11-20", from: "10:00", to: "12:00", guests: 12 },
      pick: { kind: "ONE_OFF" },
    };
    expect(fromEmailSteps({ state: changed })).toEqual([]);
    expect(fromEmailSteps({ state: { ...asRead, draft: null } })).toEqual([]);
  });
});
