import { describe, expect, it } from "vitest";
import { NEXT_ACTIONS, needsLabel } from "./reservation-row";

describe("reservation row", () => {
  it("offers seat, no-show and cancel for a booked party", () => {
    expect(NEXT_ACTIONS.BOOKED).toEqual(["seat", "markNoShow", "cancel"]);
    expect(NEXT_ACTIONS.COMPLETED).toEqual([]);
  });
  it("writes needs with their names", () => {
    const names = new Map([["a", "Gluten"]]);
    expect(
      needsLabel({
        needs: [
          { vocabularyValueId: "a", quantity: 3 },
          { vocabularyValueId: "b", quantity: 1 },
        ],
        names,
      }),
    ).toBe("Gluten 3, ? 1");
  });
});
