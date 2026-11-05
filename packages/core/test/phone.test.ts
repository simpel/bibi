import { describe, expect, it } from "vitest";
import { PhoneSchema } from "../src/shared/phone";

describe("PhoneSchema", () => {
  it("accepts valid Swedish national numbers", () => {
    expect(PhoneSchema.safeParse("070-123 45 67").success).toBe(true);
    expect(PhoneSchema.safeParse("0701234567").success).toBe(true);
    expect(PhoneSchema.safeParse("031-123456").success).toBe(true);
    expect(PhoneSchema.safeParse("08-123 45 67").success).toBe(true);
    expect(PhoneSchema.safeParse("0176-123 45").success).toBe(true);
  });

  it("accepts valid Swedish international numbers", () => {
    expect(PhoneSchema.safeParse("+46 70 123 45 67").success).toBe(true);
    expect(PhoneSchema.safeParse("+46 31-123 45 67").success).toBe(true);
    expect(PhoneSchema.safeParse("+46 70 100 00 03").success).toBe(true);
    expect(PhoneSchema.safeParse("+46 31 111").success).toBe(true);
    expect(PhoneSchema.safeParse("+46 70 000").success).toBe(true);
  });

  it("accepts valid international numbers", () => {
    expect(PhoneSchema.safeParse("+1 (415) 555-2671").success).toBe(true);
    expect(PhoneSchema.safeParse("+44 20 7946 0919").success).toBe(true);
    expect(PhoneSchema.safeParse("+47 12 34 56 78").success).toBe(true);
  });

  it("refuses letters, words, and invalid characters", () => {
    expect(PhoneSchema.safeParse("call me").success).toBe(false);
    expect(PhoneSchema.safeParse("phone").success).toBe(false);
    expect(PhoneSchema.safeParse("+46 70 123 45 abc").success).toBe(false);
    expect(PhoneSchema.safeParse("+46 70 123 #45").success).toBe(false);
  });

  it("refuses misplaced plus signs", () => {
    expect(PhoneSchema.safeParse("+46+7012345").success).toBe(false);
    expect(PhoneSchema.safeParse("070+1234567").success).toBe(false);
    expect(PhoneSchema.safeParse("++4670123456").success).toBe(false);
  });

  it("refuses numbers with too few or too many digits (ITU E.164 rules)", () => {
    // Fewer than 6 digits
    expect(PhoneSchema.safeParse("12345").success).toBe(false);
    expect(PhoneSchema.safeParse("+46 12").success).toBe(false);
    expect(PhoneSchema.safeParse("+ - ( ) ").success).toBe(false);

    // More than 15 digits
    expect(PhoneSchema.safeParse("+1234567890123456").success).toBe(false);
  });

  it("refuses unbalanced parentheses", () => {
    expect(PhoneSchema.safeParse("(070-123 45 67").success).toBe(false);
    expect(PhoneSchema.safeParse("070-123 45 67)").success).toBe(false);
  });

  it("refuses leading or trailing hyphens", () => {
    expect(PhoneSchema.safeParse("-0701234567").success).toBe(false);
    expect(PhoneSchema.safeParse("0701234567-").success).toBe(false);
  });
});
