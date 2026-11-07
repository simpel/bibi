/** The URL keys of one table's search and paging. */
export type TableQueryKeys = { q: string; page: string; pageSize: string };

export type TableQueryKeysInput = { scope?: string | undefined };

/**
 * `q`, `page` and `pageSize` for the page's main table; `<scope>.q` and so on for any other
 * table on the same page, so each keeps its own search and page.
 */
export function tableQueryKeys({ scope }: TableQueryKeysInput): TableQueryKeys {
  const prefix = scope ? `${scope}.` : "";
  return { q: `${prefix}q`, page: `${prefix}page`, pageSize: `${prefix}pageSize` };
}
