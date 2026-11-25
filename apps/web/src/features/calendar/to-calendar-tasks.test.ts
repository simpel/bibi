import { createDateTimeFormat } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { toCalendarTasks } from "./to-calendar-tasks";

const timeZone = "Europe/Stockholm";
const dates = createDateTimeFormat({
  locale: "sv",
  timeZone,
  formats: { dateFormat: null, clockFormat: null },
});
const base = {
  itemId: null,
  orderId: null,
  customerId: "c1",
  done: false,
  overdue: false,
};

describe("toCalendarTasks", () => {
  it("draws a meeting in the zone's wall time on its item's row", () => {
    const [entry] = toCalendarTasks({
      tasks: [
        {
          ...base,
          id: "t1",
          typeName: "Site visit",
          shape: "MEETING",
          startsAt: new Date("2026-12-03T13:00:00Z"),
          endsAt: new Date("2026-12-03T14:00:00Z"),
          itemId: "room",
        },
      ],
      timeZone,
      dates,
      taskHref: ({ id }) => `/tasks/${id}`,
    });
    expect(entry).toMatchObject({
      shape: "meeting",
      date: "2026-12-03",
      start: "14:00",
      end: "15:00",
      label: "Site visit",
      assetId: "room",
      href: "/tasks/t1",
    });
  });

  it("draws a deadline as a point and a meeting over midnight to the day's end", () => {
    const [deadline, late] = toCalendarTasks({
      tasks: [
        {
          ...base,
          id: "d",
          typeName: "Headcount",
          shape: "DEADLINE",
          startsAt: new Date("2026-12-03T11:00:00Z"),
          endsAt: null,
        },
        {
          ...base,
          id: "m",
          typeName: "Tasting",
          shape: "MEETING",
          startsAt: new Date("2026-12-03T21:00:00Z"),
          endsAt: new Date("2026-12-04T01:00:00Z"),
        },
      ],
      timeZone,
      dates,
      taskHref: ({ id }) => id,
    });
    expect(deadline).toMatchObject({ shape: "deadline", start: "12:00" });
    expect(deadline?.end).toBeUndefined();
    expect(deadline?.assetId).toBeUndefined();
    expect(late).toMatchObject({ start: "22:00", end: "24:00" });
  });
});
