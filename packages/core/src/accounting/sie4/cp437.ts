/**
 * IBM PC 8-bit (codepage 437), the only character set SIE 4 allows (`#FORMAT PC8`, SIE 4B §11).
 * Bytes 0x80–0xFF in order; ASCII maps to itself. Anything else becomes `?`.
 */
const HIGH_HALF =
  "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";

const QUESTION_MARK = 0x3f;

const BYTE_OF = new Map<string, number>(
  [...HIGH_HALF].map((char, index) => [char, 0x80 + index] as const),
);

/** The text as CP437 bytes; characters CP437 lacks become `?`. */
export function encodeCp437({ text }: { text: string }): Uint8Array {
  const chars = [...text];
  const bytes = new Uint8Array(chars.length);
  for (const [at, char] of chars.entries()) {
    const code = char.codePointAt(0) ?? QUESTION_MARK;
    bytes[at] = code < 0x80 ? code : (BYTE_OF.get(char) ?? QUESTION_MARK);
  }
  return bytes;
}

/** CP437 bytes back to text (tests and previews). */
export function decodeCp437({ bytes }: { bytes: Uint8Array }): string {
  return [...bytes]
    .map((byte) => (byte < 0x80 ? String.fromCharCode(byte) : HIGH_HALF[byte - 0x80]))
    .join("");
}
