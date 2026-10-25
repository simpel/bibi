import { describe, expect, it } from "vitest";
import { createNumberFormat } from "../src/number/number-format";

const NBSP = " ";
const format = ({
  locale = "sv",
  numberFormat = null,
  currencyDisplay = null,
}: {
  locale?: string;
  numberFormat?: "SPACE_COMMA" | "COMMA_DOT" | "DOT_COMMA" | "SPACE_DOT" | null;
  currencyDisplay?: "SYMBOL" | "CODE" | null;
}) => createNumberFormat({ locale, formats: { numberFormat, currencyDisplay } });

describe("createNumberFormat (#482)", () => {
  it("follows the UI language when the user chose nothing", () => {
    expect(format({}).money({ minor: 123456750 })).toBe(`1${NBSP}234${NBSP}567,50${NBSP}kr`);
    expect(format({ locale: "en" }).money({ minor: 123450 })).toBe(`SEK${NBSP}1,234.50`);
    expect(format({ locale: "en" }).number({ value: 1200 })).toBe("1,200");
  });

  it("swaps in the chosen separators and keeps the currency where the language puts it", () => {
    const user = format({ numberFormat: "COMMA_DOT", currencyDisplay: "CODE" });
    expect(user.money({ minor: 123450 })).toBe(`1,234.50${NBSP}SEK`);
    expect(user.number({ value: 1200 })).toBe("1,200");
    expect(format({ numberFormat: "DOT_COMMA" }).amount({ minor: 123450 })).toBe("1.234,50");
    expect(format({ locale: "en", numberFormat: "SPACE_DOT" }).number({ value: 1234.5 })).toBe(
      `1${NBSP}234.5`,
    );
  });

  it("writes every amount with two decimals and the record's own currency", () => {
    const user = format({ locale: "en", currencyDisplay: "SYMBOL" });
    expect(user.money({ minor: 4500, currency: "EUR" })).toBe("€45.00");
    expect(user.amount({ minor: -5 })).toBe("-0.05");
  });
});
