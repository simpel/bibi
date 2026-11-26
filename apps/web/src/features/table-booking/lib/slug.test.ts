import { describe, expect, it } from "vitest";
import { slugOf } from "./slug";

describe("slugOf", () => {
  it("makes an address word", () => {
    expect(slugOf({ name: "Kajen Bar" })).toBe("kajen-bar");
    expect(slugOf({ name: "Östra  terrassen!" })).toBe("ostra-terrassen");
  });
});
