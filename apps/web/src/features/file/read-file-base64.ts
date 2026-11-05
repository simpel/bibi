/** A browser `File` as base64 without the `data:` prefix, for `file.upload` (ADR 0063). */
export async function readFileBase64({ file }: { file: File }): Promise<string> {
  // `btoa` and `arrayBuffer` exist in browsers and Node; `Buffer` is not in the client bundle.
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}
