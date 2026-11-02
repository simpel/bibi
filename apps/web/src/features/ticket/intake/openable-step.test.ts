import { describe, expect, it } from "vitest";
import { type IntakeState, initialIntake } from "./intake-state";
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
    expect(previousStep({ step: "who" })).toBeNull();
    expect(previousStep({ step: "when" })).toBe("who");
    expect(previousStep({ step: "package" })).toBe("when");
    expect(previousStep({ step: "review" })).toBe("package");
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
