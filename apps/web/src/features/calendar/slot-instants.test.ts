import { describe, expect, it } from "vitest";
import { slotInstants } from "./slot-instants";

describe("slotInstants", () => {
  it("reads the wall times in the zone", () => {
    const slot = { date: "2026-12-03", from: "14:00", to: "15:30", timeZone: "Europe/Stockholm" };
    expect(slotInstants(slot)).toEqual({
      from: "2026-12-03T13:00:00.000Z",
      to: "2026-12-03T14:30:00.000Z",
    });
  });

  it("ends the next day when the end is not after the start", () => {
    const slot = { date: "2026-12-03", from: "22:00", to: "01:00", timeZone: "UTC" };
    expect(slotInstants(slot).to).toBe("2026-12-04T01:00:00.000Z");
  });
});
