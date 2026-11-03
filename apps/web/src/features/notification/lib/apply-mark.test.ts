import { describe, expect, it } from "vitest";
import { applyMark } from "./apply-mark";

const at = new Date("2026-11-03T10:00:00Z");
const earlier = new Date("2026-11-01T10:00:00Z");
const rows = [
  { id: "a", readAt: null },
  { id: "b", readAt: earlier },
];

describe("applyMark", () => {
  it("marks the given ids read and keeps an earlier read time", () => {
    expect(applyMark({ rows, mark: { ids: ["a", "b"], read: true, at } })).toEqual([
      { id: "a", readAt: at },
      { id: "b", readAt: earlier },
    ]);
  });

  it("marks every row unread for all", () => {
    expect(applyMark({ rows, mark: { ids: "all", read: false, at } })).toEqual([
      { id: "a", readAt: null },
      { id: "b", readAt: null },
    ]);
  });
});
