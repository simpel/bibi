import type { ReferenceEntry } from "./types";

export type FilterEntriesInput = { entries: readonly ReferenceEntry[]; query: string };

export type EntryGroup = { group: string; entries: ReferenceEntry[] };

/** Case-insensitive match on tool, operation, summary and permission, grouped in order. */
export function filterEntries({ entries, query }: FilterEntriesInput): EntryGroup[] {
  const needle = query.trim().toLowerCase();
  const matches = entries.filter((entry) =>
    [entry.toolName, entry.operation, entry.summary, entry.permission].some((text) =>
      text.toLowerCase().includes(needle),
    ),
  );
  const groups = new Map<string, ReferenceEntry[]>();
  for (const entry of matches) groups.set(entry.group, [...(groups.get(entry.group) ?? []), entry]);
  return [...groups].map(([group, list]) => ({ group, entries: list }));
}
