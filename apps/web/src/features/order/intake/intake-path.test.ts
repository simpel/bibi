import { describe, expect, it } from "vitest";
import {
  intakeStepPath,
  isPastePath,
  isPasteSegments,
  stepFromPathname,
  stepFromSegments,
  withStepPath,
} from "./intake-path";

describe("intake step path", () => {
  it("reads the step from the optional segment", () => {
    expect(stepFromSegments({ segments: undefined })).toBe("who");
    expect(stepFromSegments({ segments: [] })).toBe("who");
    expect(stepFromSegments({ segments: ["review"] })).toBe("review");
    expect(stepFromSegments({ segments: ["who"] })).toBeNull();
    expect(stepFromSegments({ segments: ["message"] })).toBeNull();
    expect(stepFromSegments({ segments: ["nope"] })).toBeNull();
    expect(stepFromSegments({ segments: ["when", "x"] })).toBeNull();
  });

  it("writes step 1 as the bare path and the others as a segment", () => {
    expect(intakeStepPath({ step: "who" })).toBe("/new/order");
    expect(intakeStepPath({ step: "package" })).toBe("/new/order/package");
  });

  it("round-trips every step", () => {
    for (const step of ["who", "when", "package", "review"] as const) {
      expect(stepFromPathname({ pathname: intakeStepPath({ step }) })).toBe(step);
    }
  });

  it("reads full pathnames and ignores other pages", () => {
    expect(stepFromPathname({ pathname: "/en/acme/new/order/when" })).toBe("when");
    expect(stepFromPathname({ pathname: "/en/acme/new/order/" })).toBe("who");
    expect(stepFromPathname({ pathname: "/en/acme/new/order-template" })).toBeNull();
    expect(stepFromPathname({ pathname: "/en/acme/orders/t1" })).toBeNull();
  });

  it("knows the paste dialog's path, which names no step", () => {
    expect(isPasteSegments({ segments: ["message"] })).toBe(true);
    expect(isPasteSegments({ segments: ["when"] })).toBe(false);
    expect(isPasteSegments({ segments: undefined })).toBe(false);
    expect(isPastePath({ pathname: "/en/acme/new/order/message" })).toBe(true);
    expect(isPastePath({ pathname: "/en/acme/new/order" })).toBe(false);
    expect(stepFromPathname({ pathname: "/en/acme/new/order/message" })).toBeNull();
    expect(withStepPath({ pathname: "/en/acme/new/order/message", step: "who" })).toBe(
      "/en/acme/new/order",
    );
  });

  it("replaces the step and keeps locale and organization", () => {
    expect(withStepPath({ pathname: "/en/acme/new/order", step: "when" })).toBe(
      "/en/acme/new/order/when",
    );
    expect(withStepPath({ pathname: "/sv/acme/new/order/review", step: "who" })).toBe(
      "/sv/acme/new/order",
    );
    expect(withStepPath({ pathname: "/en/acme/orders", step: "when" })).toBe("/en/acme/orders");
  });
});
