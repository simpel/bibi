import { describe, expect, it } from "vitest";
import { intakeStepPath, stepFromPathname, stepFromSegments, withStepPath } from "./intake-path";

describe("intake step path", () => {
  it("reads the step from the optional segment", () => {
    expect(stepFromSegments({ segments: undefined })).toBe("who");
    expect(stepFromSegments({ segments: [] })).toBe("who");
    expect(stepFromSegments({ segments: ["review"] })).toBe("review");
    expect(stepFromSegments({ segments: ["who"] })).toBeNull();
    expect(stepFromSegments({ segments: ["nope"] })).toBeNull();
    expect(stepFromSegments({ segments: ["when", "x"] })).toBeNull();
  });

  it("writes step 1 as the bare path and the others as a segment", () => {
    expect(intakeStepPath({ step: "who" })).toBe("/new/ticket");
    expect(intakeStepPath({ step: "package" })).toBe("/new/ticket/package");
  });

  it("round-trips every step", () => {
    for (const step of ["message", "who", "when", "package", "review"] as const) {
      expect(stepFromPathname({ pathname: intakeStepPath({ step }) })).toBe(step);
    }
  });

  it("reads full pathnames and ignores other pages", () => {
    expect(stepFromPathname({ pathname: "/en/acme/new/ticket/when" })).toBe("when");
    expect(stepFromPathname({ pathname: "/en/acme/new/ticket/" })).toBe("who");
    expect(stepFromPathname({ pathname: "/en/acme/new/ticket-template" })).toBeNull();
    expect(stepFromPathname({ pathname: "/en/acme/tickets/t1" })).toBeNull();
  });

  it("replaces the step and keeps locale and organization", () => {
    expect(withStepPath({ pathname: "/en/acme/new/ticket", step: "when" })).toBe(
      "/en/acme/new/ticket/when",
    );
    expect(withStepPath({ pathname: "/sv/acme/new/ticket/review", step: "who" })).toBe(
      "/sv/acme/new/ticket",
    );
    expect(withStepPath({ pathname: "/en/acme/tickets", step: "when" })).toBe("/en/acme/tickets");
  });
});
