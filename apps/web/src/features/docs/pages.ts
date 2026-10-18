/** Long-form docs pages; text lives in i18n under `docs.pages.<section>.<slug>`. */
export const DOC_SECTIONS = {
  guide: [
    "introduction",
    "getting-started",
    "assistant",
    "tickets",
    "items-and-venues",
    "needs-and-sheets",
    "payments",
    "configuration",
    "members-and-roles",
  ],
  developers: ["overview", "authentication", "rest-api", "graphql", "mcp", "approvals", "errors"],
} as const;

export type DocSection = keyof typeof DOC_SECTIONS;

/** The REST reference is the Scalar page the API serves itself (from `openapi.json`). */
export const REST_REFERENCE_HREF = "/api/v1/docs";

export const MCP_REFERENCE_HREF = "/docs/reference/mcp";

export type DocPageInput = { section: string; slug: string };

/** Narrows URL segments to a known page; `undefined` means 404. */
export function findDocPage({ section, slug }: DocPageInput) {
  if (!(section in DOC_SECTIONS)) return undefined;
  const key = section as DocSection;
  const slugs: readonly string[] = DOC_SECTIONS[key];
  return slugs.includes(slug) ? { section: key, slug } : undefined;
}

export type DocHrefInput = { section: DocSection; slug: string };

export function docHref({ section, slug }: DocHrefInput): string {
  return `/docs/${section}/${slug}`;
}
