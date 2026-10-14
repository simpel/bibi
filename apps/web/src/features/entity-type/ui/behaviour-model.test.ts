import { describe, expect, it } from "vitest";
import { toggleBehaviour } from "./behaviour-model";

describe("toggleBehaviour", () => {
  it("pulls in the required behaviour", () => {
    const next = toggleBehaviour({ current: [], behaviour: "SETUPS", checked: true });
    expect(next).toEqual(["BOOKABLE", "SETUPS"]);
  });

  it("drops dependents when a behaviour is switched off", () => {
    const current = ["COMPOSABLE", "CHOICES", "PRICED"] as const;
    const next = toggleBehaviour({ current, behaviour: "COMPOSABLE", checked: false });
    expect(next).toEqual(["PRICED"]);
  });
});
