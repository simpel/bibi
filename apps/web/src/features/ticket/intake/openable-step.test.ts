import { describe, expect, it } from "vitest";
import { type IntakeState, initialIntake } from "./intake-state";
import { entryStep, openableStep, restoredStep, restoresDraft } from "./openable-step";
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
const on = { messageEnabled: true };

describe("openable step", () => {
  it("opens the asked step when every earlier step has its answer", () => {
    expect(openableStep({ state: withWho, step: "when", ...on })).toBe("when");
    expect(openableStep({ state: picked, step: "package", ...on })).toBe("package");
    expect(openableStep({ state: reviewed, step: "review", ...on })).toBe("review");
    expect(openableStep({ state: reviewed, step: "who", ...on })).toBe("who");
  });

  it("falls back to the first step still missing input", () => {
    expect(openableStep({ state: empty, step: "when", ...on })).toBe("who");
    expect(openableStep({ state: withWho, step: "package", ...on })).toBe("when");
    expect(openableStep({ state: withWho, step: "review", ...on })).toBe("when");
    expect(openableStep({ state: picked, step: "review", ...on })).toBe("package");
  });

  it("opens step 0 only with a drafting model", () => {
    expect(openableStep({ state: withWho, step: "message", ...on })).toBe("message");
    expect(openableStep({ state: withWho, step: "message", messageEnabled: false })).toBe("when");
  });
});

describe("entering the intake", () => {
  it("restores without asking past the start or for an inbox message", () => {
    expect(restoresDraft({ urlStep: "review", hasMessage: false })).toBe(true);
    expect(restoresDraft({ urlStep: "who", hasMessage: false })).toBe(false);
    expect(restoresDraft({ urlStep: "message", hasMessage: false })).toBe(false);
    expect(restoresDraft({ urlStep: "who", hasMessage: true })).toBe(true);
  });

  it("starts on step 0 for /message or an inbox message, when drafting has a model", () => {
    expect(entryStep({ urlStep: "message", hasMessage: false, ...on })).toBe("message");
    expect(entryStep({ urlStep: "who", hasMessage: true, ...on })).toBe("message");
    expect(entryStep({ urlStep: "who", hasMessage: false, ...on })).toBe("who");
    expect(entryStep({ urlStep: "message", hasMessage: false, messageEnabled: false })).toBe("who");
  });

  it("opens a restored draft on the URL's step, or the draft's own for a message link", () => {
    const input = { stored: reviewed, hasMessage: false, ...on };
    expect(restoredStep({ ...input, urlStep: "review" })).toBe("review");
    expect(restoredStep({ ...input, stored: withWho, urlStep: "review" })).toBe("when");
    expect(restoredStep({ ...input, hasMessage: true, urlStep: "who" })).toBe("review");
  });
});
