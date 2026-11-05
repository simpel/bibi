import { describe, expect, it } from "vitest";
import {
  calculateCaretPosition,
  cleanPhoneDigits,
  countRawCharsBefore,
  formatPhoneNumber,
  handlePhoneBackspace,
  isAllowedPhoneKey,
} from "./phone-format";

describe("cleanPhoneDigits", () => {
  it("keeps leading plus and digits only", () => {
    expect(cleanPhoneDigits({ value: "+46 70-123 45 67" })).toBe("+46701234567");
    expect(cleanPhoneDigits({ value: "070-123 45 67" })).toBe("0701234567");
    expect(cleanPhoneDigits({ value: "Phone: +46 (0)70 123 45" })).toBe("+4607012345");
  });

  it("handles empty or lone plus", () => {
    expect(cleanPhoneDigits({ value: "" })).toBe("");
    expect(cleanPhoneDigits({ value: "+" })).toBe("+");
    expect(cleanPhoneDigits({ value: "   " })).toBe("");
  });

  it("strips invalid letters and symbols", () => {
    expect(cleanPhoneDigits({ value: "abc!@#$" })).toBe("");
    expect(cleanPhoneDigits({ value: "Call 070-123" })).toBe("070123");
  });
});

describe("formatPhoneNumber", () => {
  describe("Swedish national (starts with 0)", () => {
    it("formats mobile numbers as 07X-XXX XX XX", () => {
      expect(formatPhoneNumber({ value: "0701234567" })).toBe("070-123 45 67");
      expect(formatPhoneNumber({ value: "0721234567" })).toBe("072-123 45 67");
      expect(formatPhoneNumber({ value: "0731234567" })).toBe("073-123 45 67");
      expect(formatPhoneNumber({ value: "0761234567" })).toBe("076-123 45 67");
      expect(formatPhoneNumber({ value: "0791234567" })).toBe("079-123 45 67");
    });

    it("formats as user types progressively", () => {
      expect(formatPhoneNumber({ value: "0" })).toBe("0");
      expect(formatPhoneNumber({ value: "07" })).toBe("07");
      expect(formatPhoneNumber({ value: "070" })).toBe("070");
      expect(formatPhoneNumber({ value: "0701" })).toBe("070-1");
      expect(formatPhoneNumber({ value: "07012" })).toBe("070-12");
      expect(formatPhoneNumber({ value: "070123" })).toBe("070-123");
      expect(formatPhoneNumber({ value: "0701234" })).toBe("070-123 4");
      expect(formatPhoneNumber({ value: "07012345" })).toBe("070-123 45");
      expect(formatPhoneNumber({ value: "070123456" })).toBe("070-123 45 6");
      expect(formatPhoneNumber({ value: "0701234567" })).toBe("070-123 45 67");
    });

    it("formats Stockholm area code (08)", () => {
      expect(formatPhoneNumber({ value: "08" })).toBe("08");
      expect(formatPhoneNumber({ value: "08123" })).toBe("08-123");
      expect(formatPhoneNumber({ value: "0812345" })).toBe("08-123 45");
      expect(formatPhoneNumber({ value: "081234567" })).toBe("08-123 45 67");
    });

    it("formats Gothenburg (031) and other 3-digit area codes", () => {
      expect(formatPhoneNumber({ value: "031123456" })).toBe("031-123 45 6");
      expect(formatPhoneNumber({ value: "0311234567" })).toBe("031-123 45 67");
      expect(formatPhoneNumber({ value: "040123456" })).toBe("040-123 45 6");
    });

    it("formats 4-digit area codes like Norrtälje (0176)", () => {
      expect(formatPhoneNumber({ value: "017612345" })).toBe("0176-12 34 5");
      expect(formatPhoneNumber({ value: "0176123456" })).toBe("0176-12 34 56");
    });
  });

  describe("Swedish international (starts with +46)", () => {
    it("formats mobile numbers as +46 70 123 45 67", () => {
      expect(formatPhoneNumber({ value: "+46701234567" })).toBe("+46 70 123 45 67");
      expect(formatPhoneNumber({ value: "+46701000003" })).toBe("+46 70 100 00 03");
    });

    it("formats Stockholm numbers as +46 8 123 45 67", () => {
      expect(formatPhoneNumber({ value: "+4681234567" })).toBe("+46 8 123 45 67");
    });

    it("formats Gothenburg numbers as +46 31 123 45 67", () => {
      expect(formatPhoneNumber({ value: "+46311234567" })).toBe("+46 31 123 45 67");
    });

    it("auto-detects 46 prefix without plus if typed", () => {
      expect(formatPhoneNumber({ value: "46701234567" })).toBe("+46 70 123 45 67");
    });
  });

  describe("International numbers", () => {
    it("formats North American numbers as +1 (XXX) XXX-XXXX", () => {
      expect(formatPhoneNumber({ value: "+14155552671" })).toBe("+1 (415) 555-2671");
    });

    it("formats general international numbers cleanly", () => {
      expect(formatPhoneNumber({ value: "+4712345678" })).toBe("+47 123 456 78");
      expect(formatPhoneNumber({ value: "+358401234567" })).toBe("+358 401 234 567");
    });
  });
});

describe("isAllowedPhoneKey", () => {
  it("allows digits", () => {
    expect(
      isAllowedPhoneKey({
        key: "5",
        value: "070",
        selectionStart: 3,
        selectionEnd: 3,
        ctrlOrMeta: false,
      }),
    ).toBe(true);
  });

  it("allows navigation and control keys", () => {
    for (const key of ["Backspace", "ArrowLeft", "Tab", "Delete", "Enter"]) {
      expect(
        isAllowedPhoneKey({
          key,
          value: "070",
          selectionStart: 3,
          selectionEnd: 3,
          ctrlOrMeta: false,
        }),
      ).toBe(true);
    }
  });

  it("allows browser shortcuts (Ctrl/Cmd)", () => {
    expect(
      isAllowedPhoneKey({
        key: "c",
        value: "070",
        selectionStart: 0,
        selectionEnd: 3,
        ctrlOrMeta: true,
      }),
    ).toBe(true);
  });

  it("allows '+' only at the start", () => {
    expect(
      isAllowedPhoneKey({
        key: "+",
        value: "",
        selectionStart: 0,
        selectionEnd: 0,
        ctrlOrMeta: false,
      }),
    ).toBe(true);
    expect(
      isAllowedPhoneKey({
        key: "+",
        value: "46",
        selectionStart: 0,
        selectionEnd: 2,
        ctrlOrMeta: false,
      }),
    ).toBe(true);
    expect(
      isAllowedPhoneKey({
        key: "+",
        value: "070",
        selectionStart: 2,
        selectionEnd: 2,
        ctrlOrMeta: false,
      }),
    ).toBe(false);
  });

  it("blocks letters and symbols", () => {
    for (const key of ["a", "Z", "!", "@", "#", "$", "%", "/", "(", ")", "-"]) {
      expect(
        isAllowedPhoneKey({
          key,
          value: "070",
          selectionStart: 3,
          selectionEnd: 3,
          ctrlOrMeta: false,
        }),
      ).toBe(false);
    }
  });
});

describe("calculateCaretPosition and countRawCharsBefore", () => {
  it("preserves caret position when typing at the end", () => {
    const raw = countRawCharsBefore({ text: "070-123", index: 7 });
    expect(raw).toBe(6);
    const caret = calculateCaretPosition({
      rawCountBeforeCaret: raw,
      nextFormatted: "070-123",
    });
    expect(caret).toBe(7);
  });

  it("advances past separator when typing over threshold", () => {
    // User typed '1' in '0701' -> formatted '070-1'
    const raw = countRawCharsBefore({ text: "070-1", index: 5 });
    expect(raw).toBe(4);
    const caret = calculateCaretPosition({
      rawCountBeforeCaret: raw,
      nextFormatted: "070-1",
    });
    expect(caret).toBe(5);
  });
});

describe("handlePhoneBackspace", () => {
  it("deletes the preceding digit when cursor is right after hyphen", () => {
    const res = handlePhoneBackspace({
      value: "070-123",
      selectionStart: 4, // right after '-'
      selectionEnd: 4,
    });
    expect(res).not.toBeNull();
    // '070' has '0' removed -> '07' -> '071-23'
    expect(res?.nextValue).toBe("071-23");
  });

  it("returns null when deleting normal digit", () => {
    const res = handlePhoneBackspace({
      value: "070-123",
      selectionStart: 7, // after '3'
      selectionEnd: 7,
    });
    expect(res).toBeNull();
  });
});
