import { describe, expect, it } from "vitest";
import { floorSitting, slotTimes } from "./floor-data";

const lunch = {
  id: "l",
  name: "Lunch",
  layoutId: "a",
  weekdays: [0, 1, 2, 3, 4],
  first: 690,
  last: 810,
  slot: 60,
};
const dinner = {
  ...lunch,
  id: "d",
  name: "Dinner",
  weekdays: [1, 2, 3, 4, 5],
  first: 1020,
  last: 1080,
};

describe("floor data", () => {
  it("picks the sitting that runs that weekday", () => {
    // 2026-12-05 is a Saturday: only dinner runs.
    expect(floorSitting({ sittings: [lunch, dinner], date: "2026-12-05" })?.id).toBe("d");
    expect(floorSitting({ sittings: [lunch, dinner], date: "2026-12-07" })?.id).toBe("l");
  });
  it("lists the slots of a sitting in the room's zone", () => {
    const times = slotTimes({ sitting: lunch, date: "2026-12-07", timeZone: "Europe/Stockholm" });
    expect(times.map((time) => time.label)).toEqual(["11:30", "12:30", "13:30"]);
    expect(new Date(times[0]?.ms ?? 0).toISOString()).toBe("2026-12-07T10:30:00.000Z");
  });
});
