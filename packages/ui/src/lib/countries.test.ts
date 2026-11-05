import { describe, expect, it } from "vitest";
import {
  applyCountryDialCode,
  countryCodeToFlag,
  detectCountryFromPhone,
  findCountryByCode,
  localizedCountryName,
} from "./countries";

describe("countryCodeToFlag", () => {
  it("generates emoji flags from ISO 2-letter codes", () => {
    expect(countryCodeToFlag({ code: "SE" })).toBe("🇸🇪");
    expect(countryCodeToFlag({ code: "us" })).toBe("🇺🇸");
    expect(countryCodeToFlag({ code: "NO" })).toBe("🇳🇴");
    expect(countryCodeToFlag({ code: "DK" })).toBe("🇩🇰");
  });

  it("handles fallback for non-2-letter codes", () => {
    expect(countryCodeToFlag({ code: "" })).toBe("🌐");
    expect(countryCodeToFlag({ code: "SWE" })).toBe("🌐");
  });
});

describe("findCountryByCode", () => {
  it("finds Sweden, Norway, Denmark, US", () => {
    expect(findCountryByCode({ code: "se" })).toMatchObject({ code: "SE", dialCode: "+46" });
    expect(findCountryByCode({ code: "US" })).toMatchObject({ code: "US", dialCode: "+1" });
    expect(findCountryByCode({ code: "NO" })).toMatchObject({ code: "NO", dialCode: "+47" });
  });

  it("returns undefined for unknown code", () => {
    expect(findCountryByCode({ code: "XX" })).toBeUndefined();
  });
});

describe("detectCountryFromPhone", () => {
  it("detects Sweden for national numbers starting with 0", () => {
    expect(detectCountryFromPhone({ phone: "070-123 45 67" }).code).toBe("SE");
    expect(detectCountryFromPhone({ phone: "031-123456" }).code).toBe("SE");
  });

  it("detects country from international dial code prefix", () => {
    expect(detectCountryFromPhone({ phone: "+46 70 123 45 67" }).code).toBe("SE");
    expect(detectCountryFromPhone({ phone: "+47 12 34 56 78" }).code).toBe("NO");
    expect(detectCountryFromPhone({ phone: "+45 12 34 56 78" }).code).toBe("DK");
    expect(detectCountryFromPhone({ phone: "+358 40 123 4567" }).code).toBe("FI");
    expect(detectCountryFromPhone({ phone: "+1 (415) 555-2671" }).code).toBe("US");
    expect(detectCountryFromPhone({ phone: "+44 20 7946 0919" }).code).toBe("GB");
  });
});

describe("localizedCountryName", () => {
  it("returns localized country name in Swedish and English", () => {
    expect(localizedCountryName({ code: "SE", locale: "en" })).toBe("Sweden");
    expect(localizedCountryName({ code: "SE", locale: "sv" })).toBe("Sverige");
    expect(localizedCountryName({ code: "NO", locale: "sv" })).toBe("Norge");
    expect(localizedCountryName({ code: "DK", locale: "sv" })).toBe("Danmark");
  });
});

describe("applyCountryDialCode", () => {
  const norway = findCountryByCode({ code: "NO" }) ?? {
    code: "NO",
    name: "Norway",
    dialCode: "+47",
    flag: "🇳🇴",
  };
  const sweden = findCountryByCode({ code: "SE" }) ?? {
    code: "SE",
    name: "Sweden",
    dialCode: "+46",
    flag: "🇸🇪",
  };
  const us = findCountryByCode({ code: "US" }) ?? {
    code: "US",
    name: "United States",
    dialCode: "+1",
    flag: "🇺🇸",
  };

  it("returns dial code with space when input is empty", () => {
    expect(applyCountryDialCode({ phone: "", country: norway })).toBe("+47 ");
    expect(applyCountryDialCode({ phone: "+", country: us })).toBe("+1 ");
  });

  it("replaces existing international dial code with new country dial code", () => {
    expect(applyCountryDialCode({ phone: "+46 70 123 45 67", country: norway })).toBe(
      "+47 701 234 567",
    );
    expect(applyCountryDialCode({ phone: "+47 12 34 56 78", country: sweden })).toBe(
      "+46 12 345 67 8",
    );
    expect(applyCountryDialCode({ phone: "+46 70 123 45 67", country: us })).toBe(
      "+1 (701) 234-567",
    );
  });

  it("replaces leading zero on national numbers with new country dial code", () => {
    expect(applyCountryDialCode({ phone: "070-123 45 67", country: norway })).toBe(
      "+47 701 234 567",
    );
    expect(applyCountryDialCode({ phone: "070-123 45 67", country: sweden })).toBe(
      "+46 70 123 45 67",
    );
  });

  it("prepends dial code onto raw digits", () => {
    expect(applyCountryDialCode({ phone: "701234567", country: sweden })).toBe("+46 70 123 45 67");
  });
});
