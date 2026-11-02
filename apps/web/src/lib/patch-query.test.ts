import { describe, expect, it } from "vitest";
import { patchQuery } from "./patch-query";

const current = new URLSearchParams("page=3&q=volvo&mine=assigned");

describe("patchQuery", () => {
  it("keeps the page when only the page changes", () => {
    expect(patchQuery({ current, patch: { page: "4" } })).toBe("?page=4&q=volvo&mine=assigned");
  });

  it("goes back to the first page when a filter changes", () => {
    expect(patchQuery({ current, patch: { q: "kvarn" } })).toBe("?q=kvarn&mine=assigned");
  });

  it("removes keys set to null or empty", () => {
    expect(patchQuery({ current, patch: { q: null, mine: "" } })).toBe("");
  });
});
