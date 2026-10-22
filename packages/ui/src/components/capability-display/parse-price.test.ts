import { describe, expect, it } from "vitest";
import { parsePrice } from "./parse-price";

describe("parsePrice", () => {
  it("splits '250 kr per person' into amount and unit", () => {
    expect(parsePrice({ raw: "250 kr per person" })).toEqual({
      amount: "250 kr",
      unit: "per person",
    });
  });

  it("splits '1 500 SEK / day' into amount and unit", () => {
    expect(parsePrice({ raw: "1 500 SEK / day" })).toEqual({
      amount: "1 500 SEK",
      unit: "/ day",
    });
  });

  it("splits '300 kr per enhet' into amount and unit", () => {
    expect(parsePrice({ raw: "300 kr per enhet" })).toEqual({
      amount: "300 kr",
      unit: "per enhet",
    });
  });

  it("splits '500 kr flat' into amount and unit", () => {
    expect(parsePrice({ raw: "500 kr flat" })).toEqual({
      amount: "500 kr",
      unit: "flat",
    });
  });

  it("splits '400 kr fast pris' into amount and unit", () => {
    expect(parsePrice({ raw: "400 kr fast pris" })).toEqual({
      amount: "400 kr",
      unit: "fast pris",
    });
  });

  it("handles standalone prices without a unit pattern", () => {
    expect(parsePrice({ raw: "500 kr" })).toEqual({
      amount: "500 kr",
    });
  });

  it("honors explicit unit overrides", () => {
    expect(parsePrice({ raw: "250 kr", explicitUnit: "per person" })).toEqual({
      amount: "250 kr",
      unit: "per person",
    });
  });
});
