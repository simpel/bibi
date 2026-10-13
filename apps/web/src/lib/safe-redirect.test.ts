import { describe, expect, it } from "vitest";
import { safePath } from "./safe-redirect";

describe("safePath", () => {
  it("accepts same-site relative paths", () => {
    expect(safePath({ value: "/venues/1?x=2", fallback: "/" })).toBe("/venues/1?x=2");
  });

  it("rejects absolute, protocol-relative and backslash targets", () => {
    for (const value of ["https://evil.test", "//evil.test", "/\\evil.test", "venues", "", null]) {
      expect(safePath({ value, fallback: "/venues" })).toBe("/venues");
    }
  });
});
