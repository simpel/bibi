import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases, strips diacritics and appends the suffix", () => {
    expect(slugify({ name: "World of Volvo AB", suffix: "ab12" })).toBe("world-of-volvo-ab-ab12");
    expect(slugify({ name: "Herrgården Åre", suffix: "x" })).toBe("herrgarden-are-x");
  });

  it("falls back for names without usable characters", () => {
    expect(slugify({ name: "!!!", suffix: "x1" })).toBe("org-x1");
  });
});
