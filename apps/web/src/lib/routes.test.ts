import { describe, expect, it } from "vitest";
import { hasOAuthQuery } from "./oauth-query";
import { readCursor } from "./page-cursor";
import { venueRoute, withNext } from "./routes";

describe("routes", () => {
  it("builds venue and next links", () => {
    expect(venueRoute({ id: "a b" })).toBe("/venues/a%20b");
    expect(withNext({ path: "/login", next: "/venues/1?x=1" })).toBe(
      "/login?next=%2Fvenues%2F1%3Fx%3D1",
    );
  });

  it("detects the signed OAuth query and reads cursors", () => {
    expect(hasOAuthQuery({ search: "?client_id=a&sig=b" })).toBe(true);
    expect(hasOAuthQuery({ search: "?next=/venues" })).toBe(false);
    expect(readCursor({ value: ["c1", "c2"] })).toBe("c1");
    expect(readCursor({ value: "" })).toBeUndefined();
  });
});
