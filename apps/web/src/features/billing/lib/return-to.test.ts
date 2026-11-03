import { describe, expect, it } from "vitest";
import { orgRelativePath, payPath, safeReturnTo } from "./return-to";

describe("safeReturnTo", () => {
  it("keeps a path in the organization with its query", () => {
    expect(safeReturnTo({ value: "/tickets/abc?tab=lines" })).toBe("/tickets/abc?tab=lines");
    expect(safeReturnTo({ value: ["/pipeline", "/x"] })).toBe("/pipeline");
  });

  it("falls back to / for full URLs, protocol-relative paths and junk", () => {
    for (const value of [
      "https://evil.example",
      "//evil.example",
      "/\\evil",
      "tickets",
      "",
      null,
    ]) {
      expect(safeReturnTo({ value })).toBe("/");
    }
    expect(safeReturnTo({ value: undefined })).toBe("/");
  });

  it("never returns to a top-level page or the payment page", () => {
    expect(safeReturnTo({ value: "/login" })).toBe("/");
    expect(safeReturnTo({ value: "/billing/pay?returnTo=%2F" })).toBe("/");
    expect(safeReturnTo({ value: "/billing/pay/done" })).toBe("/");
  });
});

describe("payPath and orgRelativePath", () => {
  it("encodes the return path into the query", () => {
    expect(payPath({ returnTo: "/tickets?q=a b" })).toBe(
      "/billing/pay?returnTo=%2Ftickets%3Fq%3Da%20b",
    );
  });

  it("strips the locale and the organization slug", () => {
    expect(orgRelativePath({ pathname: "/sv/acme/tickets/1", search: "?x=1" })).toBe(
      "/tickets/1?x=1",
    );
    expect(orgRelativePath({ pathname: "/sv/acme", search: "" })).toBe("/");
    expect(orgRelativePath({ pathname: "/sv", search: "" })).toBeNull();
  });
});
