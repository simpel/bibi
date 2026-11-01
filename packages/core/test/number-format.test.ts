import { describe, expect, it } from "vitest";
import { createNumberFormat } from "../src/number/number-format";
import { MONEY_FORMATS, type MoneyFormat } from "../src/number/number-formats";

const NBSP = "\u00a0";
const format = ({
  locale = "sv",
  numberFormat = null,
  moneyFormat = null,
}: {
  locale?: string;
  numberFormat?: "SPACE_COMMA" | "COMMA_DOT" | "DOT_COMMA" | "SPACE_DOT" | null;
  moneyFormat?: MoneyFormat | null;
}) => createNumberFormat({ locale, formats: { numberFormat, moneyFormat } });

describe("createNumberFormat (#482)", () => {
  it("writes numbers in the UI language's style when the user chose nothing", () => {
    expect(format({ locale: "en" }).number({ value: 1200 })).toBe("1,200");
    expect(format({}).number({ value: 1234.5 })).toBe(`1${NBSP}234,5`);
  });

  it("swaps in the chosen number separators", () => {
    expect(format({ numberFormat: "COMMA_DOT" }).number({ value: 1200 })).toBe("1,200");
    expect(format({ locale: "en", numberFormat: "SPACE_DOT" }).number({ value: 1234.5 })).toBe(
      `1${NBSP}234.5`,
    );
  });

  it("writes amounts in the money format, whatever the language and number format", () => {
    const minor = 101299000;
    for (const locale of ["sv", "en"]) {
      const user = ({ moneyFormat }: { moneyFormat: MoneyFormat | null }) =>
        format({ locale, numberFormat: "DOT_COMMA", moneyFormat }).money({ minor });
      expect(user({ moneyFormat: "CODE_COMMA" })).toBe(`SEK${NBSP}1,012,990.00`);
      expect(user({ moneyFormat: "COMMA_SYMBOL" })).toBe(`1,012,990.00${NBSP}kr`);
      expect(user({ moneyFormat: "SPACE_SYMBOL" })).toBe(`1${NBSP}012${NBSP}990,00${NBSP}kr`);
      expect(user({ moneyFormat: "SPACE_CODE" })).toBe(`1${NBSP}012${NBSP}990,00${NBSP}SEK`);
      expect(user({ moneyFormat: null })).toBe(user({ moneyFormat: "SPACE_SYMBOL" }));
    }
  });

  it("writes every amount with two decimals and the record's own currency", () => {
    const user = format({ locale: "en", moneyFormat: "COMMA_SYMBOL" });
    expect(user.money({ minor: 4500, currency: "EUR" })).toBe(`45.00${NBSP}€`);
    expect(user.amount({ minor: -5 })).toBe("-0.05");
    expect(format({ moneyFormat: "SPACE_CODE" }).amount({ minor: 123450 })).toBe(`1${NBSP}234,50`);
  });

  it("gives an animated amount the settings that write it exactly as money does", () => {
    for (const locale of ["sv", "en"]) {
      for (const moneyFormat of [...MONEY_FORMATS, null]) {
        const user = format({ locale, moneyFormat });
        const flow = user.moneyFlow({ currency: "SEK" });
        const digits = new Intl.NumberFormat(flow.locales, flow.format).format(1234567.5);
        expect(`${flow.prefix}${digits}${flow.suffix}`).toBe(
          user.money({ minor: 123456750, currency: "SEK" }),
        );
      }
    }
  });
});
