import { createNumberFormat } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { wholeMoney } from "./whole-money";

const numbers = createNumberFormat({
  locale: "sv",
  formats: { numberFormat: null, moneyFormat: null },
});

describe("wholeMoney", () => {
  it("drops the decimals and rounds to whole units", () => {
    const text = wholeMoney({ numbers, minor: 123_456, currency: "SEK" });
    expect(text).not.toMatch(/,\d/);
    expect(text).toContain("1");
    expect(text).toContain("235");
  });
});
