import { describe, expect, it } from "vitest";
import { crossesBudget, OPERATION_BUDGET } from "./operation-budget";

describe("crossesBudget", () => {
  it("is false up to the budget", () => {
    expect(crossesBudget({ count: OPERATION_BUDGET })).toBe(false);
  });

  it("is true once, on the first call over the budget", () => {
    expect(crossesBudget({ count: OPERATION_BUDGET + 1 })).toBe(true);
    expect(crossesBudget({ count: OPERATION_BUDGET + 2 })).toBe(false);
  });

  it("takes a custom budget", () => {
    expect(crossesBudget({ count: 4, budget: 3 })).toBe(true);
  });
});
