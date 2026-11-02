import { describe, expect, it } from "vitest";
import { type IntakeState, initialIntake } from "./intake-state";
import { draftFixture } from "./line-fixture";
import { openableStep, previousStep, restoredStep, restoresDraft } from "./openable-step";
import { newReview } from "./review-state";

const empty = initialIntake({ intakeKey: "k" });
const who = { customerId: "c1", customerName: "Volvo", contactId: "p1", contactName: "Anna" };
const when = { date: "2026-11-20", from: "09:00", to: "12:00", guests: 12 };
const withWho: IntakeState = { ...empty, who, open: "when" };
const picked: IntakeState = { ...withWho, when, pick: { kind: "ONE_OFF" }, open: "package" };
const reviewed: IntakeState = {
  ...picked,
  open: "review",
  review: newReview({ lines: [], plannedStart: null, pickKey: "ONE_OFF" }),
};

describe("openable step", () => {
  it("opens the asked step when every earlier step has its answer", () => {
    expect(openableStep({ state: withWho, step: "when" })).toBe("when");
    expect(openableStep({ state: picked, step: "package" })).toBe("package");
    expect(openableStep({ state: reviewed, step: "review" })).toBe("review");
    expect(openableStep({ state: reviewed, step: "who" })).toBe("who");
  });

  it("falls back to the first step still missing input", () => {
    expect(openableStep({ state: empty, step: "when" })).toBe("who");
    expect(openableStep({ state: withWho, step: "package" })).toBe("when");
    expect(openableStep({ state: withWho, step: "review" })).toBe("when");
    expect(openableStep({ state: picked, step: "review" })).toBe("package");
  });

  it("goes back one step, and not before step 1", () => {
    const state = reviewed;
    expect(previousStep({ state, step: "who" })).toBeNull();
    expect(previousStep({ state, step: "when" })).toBe("who");
    expect(previousStep({ state, step: "package" })).toBe("when");
    expect(previousStep({ state, step: "review" })).toBe("package");
  });

  it("has the choices step only while its lines exist (ADR 0089)", () => {
    const line = draftFixture({ key: "l1" });
    const review = { ...newReview({ lines: [line], plannedStart: null, pickKey: "t1" }) };
    const asked: IntakeState = { ...reviewed, review: { ...review, choiceKeys: ["l1"] } };
    expect(openableStep({ state: asked, step: "choices" })).toBe("choices");
    expect(previousStep({ state: asked, step: "review" })).toBe("choices");
    const gone: IntakeState = { ...asked, review: { ...review, choiceKeys: ["other"] } };
    expect(openableStep({ state: gone, step: "choices" })).toBe("review");
    expect(openableStep({ state: picked, step: "choices" })).toBe("package");
  });
});

describe("entering the intake", () => {
  it("restores without asking past the start or for an inbox message", () => {
    expect(restoresDraft({ urlStep: "review", hasMessage: false })).toBe(true);
    expect(restoresDraft({ urlStep: "who", hasMessage: false })).toBe(false);
    expect(restoresDraft({ urlStep: "who", hasMessage: true })).toBe(true);
  });

  it("opens a restored draft on the URL's step, or the draft's own for a message link", () => {
    const input = { stored: reviewed, hasMessage: false };
    expect(restoredStep({ ...input, urlStep: "review" })).toBe("review");
    expect(restoredStep({ ...input, stored: withWho, urlStep: "review" })).toBe("when");
    expect(restoredStep({ ...input, hasMessage: true, urlStep: "who" })).toBe("review");
  });
});
