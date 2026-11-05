import { describe, expect, it } from "vitest";
import { isValidWebsiteUrl, normalizeWebsiteUrl } from "./website-format";

describe("normalizeWebsiteUrl", () => {
  it("prepends https:// when protocol is missing", () => {
    expect(normalizeWebsiteUrl({ value: "example.se" })).toBe("https://example.se");
    expect(normalizeWebsiteUrl({ value: "www.worldofvolvo.com" })).toBe(
      "https://www.worldofvolvo.com",
    );
  });

  it("preserves http:// and https://", () => {
    expect(normalizeWebsiteUrl({ value: "http://example.se" })).toBe("http://example.se");
    expect(normalizeWebsiteUrl({ value: "https://example.se" })).toBe("https://example.se");
  });

  it("handles empty values", () => {
    expect(normalizeWebsiteUrl({ value: "" })).toBe("");
    expect(normalizeWebsiteUrl({ value: "   " })).toBe("");
  });
});

describe("isValidWebsiteUrl", () => {
  it("validates good website URLs", () => {
    expect(isValidWebsiteUrl({ value: "https://bibi.se" })).toBe(true);
    expect(isValidWebsiteUrl({ value: "example.com" })).toBe(true);
    expect(isValidWebsiteUrl({ value: "www.example.co.uk" })).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(isValidWebsiteUrl({ value: "" })).toBe(false);
    expect(isValidWebsiteUrl({ value: "localhost" })).toBe(false);
    expect(isValidWebsiteUrl({ value: "not a url" })).toBe(false);
  });
});
