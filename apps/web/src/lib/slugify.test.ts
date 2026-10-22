import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify (ADR 0062)", () => {
  it("lowercases and strips diacritics", () => {
    expect(slugify({ name: "World of Volvo AB" })).toBe("world-of-volvo-ab");
    expect(slugify({ name: "Säröhus Konferens" })).toBe("sarohus-konferens");
    expect(slugify({ name: "STR" })).toBe("str");
  });

  it("cuts at 40 characters without a trailing dash", () => {
    expect(slugify({ name: `${"a".repeat(39)} b` })).toBe("a".repeat(39));
  });

  it("is empty for names without usable characters", () => {
    expect(slugify({ name: "!!!" })).toBe("");
  });
});
