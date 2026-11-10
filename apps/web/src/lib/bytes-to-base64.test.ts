import { describe, expect, it } from "vitest";
import { bytesToBase64 } from "./bytes-to-base64";

describe("bytesToBase64", () => {
  it("matches Node's base64 for small and chunked inputs", () => {
    const small = new TextEncoder().encode("Bibi ÅÄÖ");
    expect(bytesToBase64({ bytes: small })).toBe(Buffer.from(small).toString("base64"));
    const large = Uint8Array.from({ length: 70_000 }, (_, index) => index % 256);
    expect(bytesToBase64({ bytes: large })).toBe(Buffer.from(large).toString("base64"));
  });
});
