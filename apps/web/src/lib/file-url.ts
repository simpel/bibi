/** Where the browser loads a stored file (ADR 0063): `/api/files/<key>`, each segment encoded. */
export function fileUrl({ key }: { key: string }): string {
  return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`;
}
