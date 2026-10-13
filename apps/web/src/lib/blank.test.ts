import { describe, expect, it } from "vitest";
import { blankToNull, blankToUndefined, numberOrNull, numberOrUndefined } from "./blank";

describe("blank helpers", () => {
  it("turns empty text into null/undefined and trims", () => {
    expect(blankToNull({ value: "  " })).toBeNull();
    expect(blankToNull({ value: " Göteborg " })).toBe("Göteborg");
    expect(blankToUndefined({ value: "" })).toBeUndefined();
  });

  it("parses numbers, accepting a decimal comma", () => {
    expect(numberOrNull({ value: "" })).toBeNull();
    expect(numberOrNull({ value: "12,5" })).toBe(12.5);
    expect(numberOrUndefined({ value: "40" })).toBe(40);
    expect(numberOrUndefined({ value: " " })).toBeUndefined();
  });

  it("keeps NaN so validation can reject it", () => {
    expect(Number.isNaN(numberOrNull({ value: "abc" }))).toBe(true);
  });
});
