import { describe, expect, it } from "vitest";
import { weekdaysLabel } from "./weekdays";

const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

describe("weekdaysLabel", () => {
  it("writes a run as a range", () => {
    expect(weekdaysLabel({ days: [0, 1, 2, 3, 4], names })).toBe("Mon–Fri");
  });
  it("lists separate days", () => {
    expect(weekdaysLabel({ days: [3, 1], names })).toBe("Tue, Thu");
  });
  it("lists two neighbours", () => {
    expect(weekdaysLabel({ days: [5, 6], names })).toBe("Sat, Sun");
  });
});
