export type DownloadBytesInput = {
  /** The file's bytes, base64 encoded (they are not text: SIE is codepage 437). */
  base64: string;
  filename: string;
  /** Sent as is: no charset is added, so the browser never reinterprets the bytes. */
  mimeType?: string;
};

/** Hands bytes to the browser as a file download; unlike `downloadText` it never re-encodes. */
export function downloadBytes({
  base64,
  filename,
  mimeType = "text/plain",
}: DownloadBytesInput): void {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replaceAll("/", "-");
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
