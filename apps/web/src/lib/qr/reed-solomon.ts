/** Multiplication in GF(2^8) with the QR polynomial x^8 + x^4 + x^3 + x^2 + 1. */
function multiply({ a, b }: { a: number; b: number }): number {
  let product = 0;
  for (let i = 7; i >= 0; i -= 1) {
    product = (product << 1) ^ ((product >>> 7) * 0x11d);
    product ^= ((b >>> i) & 1) * a;
  }
  return product;
}

/** The generator polynomial's coefficients (highest first, leading 1 dropped). */
function generator({ degree }: { degree: number }): number[] {
  const result: number[] = Array.from({ length: degree }, (_, i) => (i === degree - 1 ? 1 : 0));
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = multiply({ a: result[j] ?? 0, b: root });
      if (j + 1 < result.length) result[j] = (result[j] ?? 0) ^ (result[j + 1] ?? 0);
    }
    root = multiply({ a: root, b: 0x02 });
  }
  return result;
}

export type ReedSolomonInput = { data: readonly number[]; degree: number };

/** The `degree` error correction codewords of one block. */
export function reedSolomonRemainder({ data, degree }: ReedSolomonInput): number[] {
  const divisor = generator({ degree });
  const result = Array.from({ length: degree }, () => 0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() ?? 0);
    result.push(0);
    divisor.forEach((coefficient, i) => {
      result[i] = (result[i] ?? 0) ^ multiply({ a: coefficient, b: factor });
    });
  }
  return result;
}
