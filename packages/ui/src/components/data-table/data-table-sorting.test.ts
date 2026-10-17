import { describe, expect, it } from "vitest";
import { compareValues } from "./data-table-sorting";

describe("compareValues", () => {
  it("compares numbers numerically", () => {
    expect(compareValues({ a: 2, b: 10 })).toBeLessThan(0);
  });

  it("compares strings locale aware and numeric aware", () => {
    expect(compareValues({ a: "Åsa", b: "Bo" })).toBeLessThan(0);
    expect(compareValues({ a: "Room 2", b: "Room 10" })).toBeLessThan(0);
    expect(compareValues({ a: "abc", b: "ABC" })).toBe(0);
  });

  it("compares dates by time", () => {
    expect(compareValues({ a: new Date(1), b: new Date(2) })).toBeLessThan(0);
  });

  it("sorts empty values last when ascending", () => {
    expect(compareValues({ a: null, b: "a" })).toBeGreaterThan(0);
    expect(compareValues({ a: "a", b: undefined })).toBeLessThan(0);
    expect(compareValues({ a: null, b: undefined })).toBe(0);
  });
});
