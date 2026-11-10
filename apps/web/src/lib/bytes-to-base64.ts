export type BytesToBase64Input = { bytes: Uint8Array };

const CHUNK = 0x8000;

/** Standard base64 of raw bytes, in chunks so a large file never overflows the call stack. */
export function bytesToBase64({ bytes }: BytesToBase64Input): string {
  let binary = "";
  for (let start = 0; start < bytes.length; start += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(start, start + CHUNK));
  }
  return btoa(binary);
}
