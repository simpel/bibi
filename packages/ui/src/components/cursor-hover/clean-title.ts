/**
 * Strips place suffixes (e.g. " · Asperö (G38)") from line names when the place is shown in details.
 */
export function cleanTitle({ title, resource }: { title: string; resource?: string }): string {
  if (!title.includes(" · ")) return title;
  const parts = title.split(" · ");
  if (parts.length < 2) return title;
  const last = parts.slice(1).join(" · ");
  if (resource) {
    const cleanRes = resource
      .replace(/\s*\([^)]*\)/g, "")
      .trim()
      .toLowerCase();
    const cleanLast = last
      .replace(/\s*\([^)]*\)/g, "")
      .trim()
      .toLowerCase();
    if (cleanRes && (cleanLast.includes(cleanRes) || cleanRes.includes(cleanLast))) {
      return parts[0] ?? title;
    }
  }
  if (/\([A-Z]?\d+\)$/.test(last.trim())) {
    return parts[0] ?? title;
  }
  return title;
}
