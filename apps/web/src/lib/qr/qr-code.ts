import {
  applyMask,
  dataCapacity,
  dataCodewords,
  drawCodewords,
  drawFormat,
  drawFunctionPatterns,
  type Grid,
  interleaved,
  VERSIONS,
} from "./qr-matrix";
import { qrPenalty } from "./qr-penalty";

/**
 * A QR code (ISO/IEC 18004) for short text: byte mode, error correction level M, versions 1 to
 * 10 (up to 213 bytes), with no dependency. `modules[y][x]` is true for a dark module.
 */
export type QrCode = { size: number; modules: boolean[][] };

export type EncodeQrInput = {
  text: string;
  /** A fixed mask 0–7 (tests); by default the one with the lowest penalty. */
  mask?: number | undefined;
};

const emptyGrid = ({ size }: { size: number }): Grid => ({
  size,
  modules: Array.from({ length: size }, () => Array.from({ length: size }, () => false)),
  reserved: Array.from({ length: size }, () => Array.from({ length: size }, () => false)),
});

/** The smallest version that holds the bytes, or null when the text is too long. */
function versionFor({ length }: { length: number }): number | null {
  for (let version = 1; version <= VERSIONS; version += 1) {
    const header = version < 10 ? 2 : 3;
    if (length + header <= dataCapacity({ version })) return version;
  }
  return null;
}

/** The QR code of `text` with the mask that scores lowest, or null when it does not fit. */
export function encodeQr({ text, mask: fixed }: EncodeQrInput): QrCode | null {
  const bytes = new TextEncoder().encode(text);
  const version = versionFor({ length: bytes.length });
  if (version === null) return null;
  const codewords = interleaved({ data: dataCodewords({ bytes, version }), version });
  const grid = emptyGrid({ size: version * 4 + 17 });
  drawFunctionPatterns({ grid, version });
  drawCodewords({ grid, codewords });
  let best = { mask: fixed ?? 0, penalty: Number.POSITIVE_INFINITY };
  for (let mask = 0; fixed === undefined && mask < 8; mask += 1) {
    applyMask({ grid, mask });
    drawFormat({ grid, mask });
    const penalty = qrPenalty({ modules: grid.modules });
    if (penalty < best.penalty) best = { mask, penalty };
    applyMask({ grid, mask });
  }
  applyMask({ grid, mask: best.mask });
  drawFormat({ grid, mask: best.mask });
  return { size: grid.size, modules: grid.modules };
}
