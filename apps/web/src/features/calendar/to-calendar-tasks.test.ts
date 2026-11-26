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
  itemIds: [],
  orderId: null,
  customerId: "c1",
  done: false,
  overdue: false,
};

describe("toCalendarTasks", () => {
  it("draws a task as a point at its due time in the zone's wall time", () => {
    const [entry] = toCalendarTasks({
      tasks: [
        {
          ...base,
          id: "t1",
          typeName: "Site visit",
          dueAt: new Date("2026-12-03T13:00:00Z"),
          itemIds: ["room", "hall"],
        },
      ],
      timeZone,
      dates,
      taskHref: ({ id }) => `/tasks/${id}`,
    });
    expect(entry).toMatchObject({
      date: "2026-12-03",
      start: "14:00",
      label: "Site visit",
      assetIds: ["room", "hall"],
      href: "/tasks/t1",
    });
    expect(entry).not.toHaveProperty("end");
  });

  it("puts a task due after local midnight on the next day and names no room without one", () => {
    const [late] = toCalendarTasks({
      tasks: [
        {
          ...base,
          id: "d",
          typeName: "Headcount",
          dueAt: new Date("2026-12-03T23:30:00Z"),
          done: true,
        },
      ],
      timeZone,
      dates,
      taskHref: ({ id }) => id,
    });
    expect(late).toMatchObject({ date: "2026-12-04", start: "00:30", done: true });
    expect(late?.assetIds).toBeUndefined();
  });
});
