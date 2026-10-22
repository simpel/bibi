import { describe, expect, it } from "vitest";
import { type NextWelcomeStepInput, nextWelcomeStep, welcomePath } from "./welcome-step";

const done: NextWelcomeStepInput = {
  profileComplete: true,
  hoursSet: true,
  setupStatus: "COMPLETED",
  canSetup: true,
};

describe("nextWelcomeStep (ADR 0061)", () => {
  it("asks everyone for the profile, then the hours", () => {
    expect(nextWelcomeStep({ ...done, profileComplete: false, hoursSet: false })).toBe("profile");
    expect(nextWelcomeStep({ ...done, hoursSet: false })).toBe("hours");
  });

  it("sends a member who can set up a pending organization through the setup", () => {
    expect(nextWelcomeStep({ ...done, setupStatus: "PENDING" })).toBe("setup/organization");
  });

  it("sends everyone else to the waiting page while the setup is pending", () => {
    expect(nextWelcomeStep({ ...done, setupStatus: "PENDING", canSetup: false })).toBe("done");
  });

  it("opens the app when nothing is left", () => {
    expect(nextWelcomeStep({ ...done })).toBeNull();
    expect(nextWelcomeStep({ ...done, setupStatus: "SKIPPED" })).toBeNull();
  });

  it("builds the step paths", () => {
    expect(welcomePath()).toBe("/welcome");
    expect(welcomePath({ step: "setup/kind" })).toBe("/welcome/setup/kind");
  });
});
