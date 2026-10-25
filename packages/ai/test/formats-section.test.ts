import { describe, expect, it } from "vitest";
import { formatsSection } from "../src/prompt/formats-section";

const NBSP = " ";
const NOW = new Date("2026-10-25T09:00:00Z");

describe("formatsSection (ADR 0046, #482)", () => {
  it("shows the user's own date, clock, number and amount formats as examples", () => {
    const text = formatsSection({
      locale: "sv",
      timeZone: "Europe/Stockholm",
      formats: {
        ...{ dateFormat: "YYYY_MM_DD", clockFormat: "H12" },
        ...{ numberFormat: "COMMA_DOT", currencyDisplay: "CODE" },
      },
      now: NOW,
    });
    expect(text).toContain("dates like 2026-08-27");
    expect(text).toMatch(/times like 2:30/);
    expect(text).toContain(`amounts like 1,234.50${NBSP}SEK`);
    expect(text).toContain("numbers like 1,234.5");
    expect(text).toContain("minor units");
  });

  it("follows the UI language when the user chose nothing", () => {
    const none = { dateFormat: null, clockFormat: null, numberFormat: null, currencyDisplay: null };
    const text = formatsSection({
      locale: "en",
      timeZone: "Europe/Stockholm",
      formats: none,
      now: NOW,
    });
    expect(text).toContain("dates like 27 Aug 2026");
    expect(text).toContain(`amounts like SEK${NBSP}1,234.50`);
  });
});
