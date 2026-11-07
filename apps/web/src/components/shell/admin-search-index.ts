import type { AdminGroup, AdminKey } from "./admin-items";
import type { AdminSectionId } from "./admin-sections";

/** One place the administration search can take you to: a section of a page. */
export type AdminSearchEntry = {
  id: AdminSectionId;
  /** The sidebar page it belongs to, shown under the result. */
  page: AdminKey;
  href: string;
  anchor: string;
};

/**
 * The index behind the administration search, built from the sidebar's own pages and sections
 * (`ADMIN_GROUPS`), so a new section is findable as soon as it is on a page.
 */
export function adminSearchIndex({
  groups,
}: {
  groups: readonly AdminGroup[];
}): AdminSearchEntry[] {
  return groups.flatMap((group) =>
    group.pages.flatMap((page) =>
      page.sections.map((section) => ({
        id: section.id,
        page: page.key,
        href: page.href,
        anchor: section.anchor,
      })),
    ),
  );
}

/** Lower case without diacritics, so "tidszon" finds "Tidszon" and "a" finds "å". */
export function foldText({ text }: { text: string }): string {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}

export type SearchableEntry = AdminSearchEntry & {
  label: string;
  pageLabel: string;
  keywords: string;
};

export type SearchAdminInput = { entries: readonly SearchableEntry[]; query: string };

/**
 * The entries every word of the query appears in (label, page or keywords), the ones whose
 * label starts with the query first.
 */
export function searchAdmin({ entries, query }: SearchAdminInput): SearchableEntry[] {
  const words = foldText({ text: query }).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const first = words.join(" ");
  const hits = entries.filter((entry) => {
    const haystack = foldText({ text: `${entry.label} ${entry.pageLabel} ${entry.keywords}` });
    return words.every((word) => haystack.includes(word));
  });
  const starts = ({ entry }: { entry: SearchableEntry }) =>
    foldText({ text: entry.label }).startsWith(first) ? 0 : 1;
  return [...hits].sort((a, b) => starts({ entry: a }) - starts({ entry: b }));
}

/** The link of a section: the page and the anchor on it. */
export function adminSectionHref({ entry }: { entry: Pick<AdminSearchEntry, "href" | "anchor"> }) {
  return `${entry.href}#${entry.anchor}`;
}
