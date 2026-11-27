import { describe, expect, it } from "vitest";
import { floorSitting, slotTimes } from "./floor-data";

const lunch = {
  id: "l",
  layoutId: "a",
  closed: false,
  first: 690,
  last: 810,
  slot: 60,
};
const dinner = {
  ...lunch,
  id: "d",
  closed: false,
  first: 1020,
  last: 1080,
};

describe("floor data", () => {
  it("picks the first sitting open that day, else the first", () => {
    expect(floorSitting({ sittings: [{ ...lunch, closed: true }, dinner] })?.id).toBe("d");
    expect(floorSitting({ sittings: [lunch, dinner] })?.id).toBe("l");
    expect(floorSitting({ sittings: [{ ...lunch, closed: true }] })?.id).toBe("l");
  });
  it("lists the slots of a sitting in the room's zone", () => {
    const times = slotTimes({ sitting: lunch, date: "2026-12-07", timeZone: "Europe/Stockholm" });
    expect(times.map((time) => time.label)).toEqual(["11:30", "12:30", "13:30"]);
    expect(new Date(times[0]?.ms ?? 0).toISOString()).toBe("2026-12-07T10:30:00.000Z");
  });
});
