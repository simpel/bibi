export type DownloadTextInput = { text: string; filename: string; mimeType?: string };

/** Hands a text to the browser as a file download (Blob + temporary link). */
export function downloadText({
  text,
  filename,
  mimeType = "text/markdown",
}: DownloadTextInput): void {
  const url = URL.createObjectURL(new Blob([text], { type: `${mimeType};charset=utf-8` }));
  const link = document.createElement("a");
  link.href = url;
  // `create-venue/SKILL.md` → a flat file name the OS accepts.
  link.download = filename.replaceAll("/", "-");
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
