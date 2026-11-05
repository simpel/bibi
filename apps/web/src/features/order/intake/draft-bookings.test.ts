import { describe, expect, it } from "vitest";
import { draftBookings } from "./draft-bookings";
import { at, draftFixture, issueFixture, previewLineFixture } from "./line-fixture";

const look = {
  ...{ name: "Draft", color: "var(--primary)", ink: "var(--foreground)" },
  hold: "soft" as const,
};
const input = {
  assetIds: new Set(["i1"]),
  timeZone: "UTC",
  draft: look,
  clash: { ...look, name: "Clash" },
  order: "New booking",
  planned: null,
};

describe("draftBookings", () => {
  it("places timed lines on their item's row, and leaves the rest out", () => {
    const lines = [
      draftFixture({ from: 9, to: 11 }),
      draftFixture({ key: "l2", itemId: null, from: 12, to: 13 }),
      draftFixture({ key: "l3" }),
    ];
    const bookings = draftBookings({ ...input, lines });
    expect(bookings.map(({ id, assetId, start, end }) => [id, assetId, start, end])).toEqual([
      [`draft-l1:${at({ hour: 9 }).toISOString().slice(0, 10)}`, "i1", "09:00", "11:00"],
    ]);
    expect(bookings[0]?.order).toBe("New booking");
  });

  it("shows a clashing line in the clash look", () => {
    const lines = [draftFixture({ from: 9, to: 11 })];
    const planned = [previewLineFixture({ issues: [issueFixture({ kind: "HARD_CLASH" })] })];
    expect(draftBookings({ ...input, lines, planned })[0]?.state.name).toBe("Clash");
  });

  it("places a bookable add-on on its item's row in the line's time unless its own (ADR 0088)", () => {
    const addOn = {
      key: "a",
      itemId: "i2",
      name: "Projector",
      quantity: null,
      unitPriceMinor: null,
    };
    const lines = [
      draftFixture({
        itemId: "food",
        from: 9,
        to: 11,
        addOns: [{ ...addOn, startsAt: null, endsAt: null }],
      }),
    ];
    const clash = previewLineFixture({ issues: [issueFixture({ kind: "HARD_CLASH" })] });
    const planned = [previewLineFixture({ addOns: [clash] })];
    const bookings = draftBookings({ ...input, assetIds: new Set(["i2"]), lines, planned });
    expect(
      bookings.map(({ assetId, name, start, end, state }) => [
        assetId,
        name,
        start,
        end,
        state.name,
      ]),
    ).toEqual([["i2", "Projector", "09:00", "11:00", "Clash"]]);
  });
});
