import { describe, expect, it } from "vitest";
import { toggleCapability } from "./capability-model";

describe("toggleCapability", () => {
  it("pulls in the required capability", () => {
    const next = toggleCapability({ current: [], capability: "SETUPS", checked: true });
    expect(next).toEqual(["BOOKABLE", "SETUPS"]);
  });

  it("drops dependents when a capability is switched off", () => {
    const current = ["BOOKABLE", "SETUPS", "PRICED"] as const;
    const next = toggleCapability({ current, capability: "BOOKABLE", checked: false });
    expect(next).toEqual(["PRICED"]);
  });

  it("keeps CUSTOMISATIONS without BUNDLE (ADR 0059)", () => {
    const current = ["BUNDLE", "CUSTOMISATIONS", "PRICED"] as const;
    const next = toggleCapability({ current, capability: "BUNDLE", checked: false });
    expect(next).toEqual(["PRICED", "CUSTOMISATIONS"]);
  });
});
