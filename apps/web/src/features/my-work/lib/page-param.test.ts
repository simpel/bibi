import { describe, expect, it } from "vitest";
import { pageParam } from "./page-param";

describe("pageParam", () => {
  it("reads a page from 1 and falls back to the first page", () => {
    expect(pageParam({ value: "3" })).toBe(3);
    expect(pageParam({ value: undefined })).toBe(1);
    expect(pageParam({ value: "0" })).toBe(1);
    expect(pageParam({ value: "abc" })).toBe(1);
    expect(pageParam({ value: ["2", "5"] })).toBe(2);
  });
});
