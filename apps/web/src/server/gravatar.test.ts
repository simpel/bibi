import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { gravatarUrl } from "./gravatar";

describe("gravatarUrl", () => {
  it("computes the lowercase sha256 hash with d=404", () => {
    const email = "  MyEmail@Example.COM ";
    const expectedHash = createHash("sha256").update("myemail@example.com").digest("hex");
    const url = gravatarUrl({ email, size: 200 });
    expect(url).toBe(`https://www.gravatar.com/avatar/${expectedHash}?s=200&d=404`);
  });

  it("returns empty string for blank email", () => {
    expect(gravatarUrl({ email: "   " })).toBe("");
  });
});
