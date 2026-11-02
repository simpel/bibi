export type PatchQueryInput = {
  current: URLSearchParams;
  patch: Record<string, string | null>;
  /** The page key: any other change goes back to the first page. */
  pageKey?: string;
};

/** `?…` for the patched URL state (null or "" removes a key); a filter change resets the page. */
export function patchQuery({ current, patch, pageKey = "page" }: PatchQueryInput): string {
  const next = new URLSearchParams(current);
  const filterChanged = Object.keys(patch).some((key) => key !== pageKey);
  if (filterChanged && !(pageKey in patch)) next.delete(pageKey);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  return query ? `?${query}` : "";
}
