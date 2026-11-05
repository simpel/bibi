import { describe, expect, it } from "vitest";
import { cleanEmail, isAllowedEmailKey, isValidEmail } from "./email-format";

describe("cleanEmail", () => {
  it("trims and strips spaces", () => {
    expect(cleanEmail({ value: "  alice@example.com  " })).toBe("alice@example.com");
    expect(cleanEmail({ value: "alice @ example . com" })).toBe("alice@example.com");
  });
});

describe("isAllowedEmailKey", () => {
  it("blocks spacebar", () => {
    expect(isAllowedEmailKey({ key: " ", ctrlOrMeta: false })).toBe(false);
    expect(isAllowedEmailKey({ key: "Spacebar", ctrlOrMeta: false })).toBe(false);
  });

  it("allows standard characters and shortcuts", () => {
    expect(isAllowedEmailKey({ key: "a", ctrlOrMeta: false })).toBe(true);
    expect(isAllowedEmailKey({ key: "@", ctrlOrMeta: false })).toBe(true);
    expect(isAllowedEmailKey({ key: ".", ctrlOrMeta: false })).toBe(true);
    expect(isAllowedEmailKey({ key: "v", ctrlOrMeta: true })).toBe(true);
  });
});

describe("isValidEmail", () => {
  it("validates good emails", () => {
    expect(isValidEmail({ value: "admin@bibi.se" })).toBe(true);
    expect(isValidEmail({ value: "user.name+tag@sub.domain.co.uk" })).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail({ value: "" })).toBe(false);
    expect(isValidEmail({ value: "notanemail" })).toBe(false);
    expect(isValidEmail({ value: "user@" })).toBe(false);
    expect(isValidEmail({ value: "@domain.com" })).toBe(false);
    expect(isValidEmail({ value: "user@domain" })).toBe(false);
  });
});
