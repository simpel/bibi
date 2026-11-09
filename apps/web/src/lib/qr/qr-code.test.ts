import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { encodeQr } from "./qr-code";
import {
  applyMask,
  dataCodewords,
  drawCodewords,
  drawFormat,
  drawFunctionPatterns,
  type Grid,
  interleaved,
} from "./qr-matrix";
import { reedSolomonRemainder } from "./reed-solomon";

const drawn = ({ modules }: { modules: boolean[][] }) =>
  modules.map((row) => row.map((dark) => (dark ? "#" : ".")).join("")).join("\n");

const sha256 = ({ text }: { text: string }) => createHash("sha256").update(text).digest("hex");

/**
 * References from the segno QR library (version 10, level M, byte mode, 200 × "z"). segno adds
 * one more zero codeword after a byte-aligned terminator (valid, but not what we emit), so the
 * test draws segno's codewords with our matrix code.
 */
const REFERENCE = {
  0: "41f19ca76f04e73ab83448827c4edad3509796b67f8185c80427f4e9c18f4001",
  5: "e765096bbda61dae549106c40cb38a903c40f1dae1295517340930acdcf535ee",
} as const;

describe("encodeQr", () => {
  it("computes the error correction of a reference block", () => {
    const data = [64, 38, 134, 144, 0, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236];
    expect(reedSolomonRemainder({ data, degree: 10 })).toEqual([
      3, 176, 181, 118, 164, 81, 28, 171, 55, 100,
    ]);
  });

  it("writes mode, count, terminator and padding as the standard says", () => {
    const words = dataCodewords({ bytes: new TextEncoder().encode("hi"), version: 1 });
    expect(words.slice(0, 6)).toEqual([64, 38, 134, 144, 236, 17]);
    expect(words).toHaveLength(16);
  });

  it("draws the same symbol as a reference encoder, with alignment and version info", () => {
    const own = dataCodewords({ bytes: new TextEncoder().encode("z".repeat(200)), version: 10 });
    const segno = [...own.slice(0, 203), 0, ...own.slice(203, -1)];
    for (const mask of [0, 5] as const) {
      const grid: Grid = {
        size: 57,
        modules: Array.from({ length: 57 }, () => Array<boolean>(57).fill(false)),
        reserved: Array.from({ length: 57 }, () => Array<boolean>(57).fill(false)),
      };
      drawFunctionPatterns({ grid, version: 10 });
      drawCodewords({ grid, codewords: interleaved({ data: segno, version: 10 }) });
      applyMask({ grid, mask });
      drawFormat({ grid, mask });
      expect(sha256({ text: drawn(grid) })).toBe(REFERENCE[mask]);
    }
  });

  it("picks the smallest version and refuses text that does not fit", () => {
    expect(encodeQr({ text: `D${"0".repeat(32)}` })?.size).toBe(29);
    expect(encodeQr({ text: "x".repeat(214) })).toBeNull();
  });
});
