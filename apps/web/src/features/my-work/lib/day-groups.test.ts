import { describe, expect, it } from "vitest";
import { dayGroups } from "./day-groups";

describe("dayGroups", () => {
  it("splits time-ordered rows into consecutive days", () => {
    const rows = [
      { day: "Thu", n: 1 },
      { day: "Thu", n: 2 },
      { day: "Fri", n: 3 },
    ];
    expect(dayGroups({ rows, dayOf: (row) => row.day })).toEqual([
      { key: "Thu", rows: [rows[0], rows[1]] },
      { key: "Fri", rows: [rows[2]] },
    ]);
  });

  it("gives no groups for no rows", () => {
    expect(dayGroups({ rows: [], dayOf: () => "x" })).toEqual([]);
  });
});
