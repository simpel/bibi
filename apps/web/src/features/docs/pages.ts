/** Staff guides under `/support/<slug>`; text in i18n under `support.guides.<slug>`. */
export const GUIDE_PAGES = [
  "introduction",
  "getting-started",
  "assistant",
  "orders",
  "inbox",
  "items-and-venues",
  "needs-and-run-sheets",
  "payments",
  "configuration",
  "members-and-roles",
] as const;

/**
 * Developer pages; text in i18n under `docs.pages.developers.<slug>`. The first is the
 * `/developers` start page, the rest live at `/developers/<slug>`.
 */
export const DEVELOPER_PAGES = [
  "overview",
  "authentication",
  "rest-api",
  "graphql",
  "mcp",
  "approvals",
  "errors",
] as const;

/** The REST reference is the Scalar page the API serves itself (from `openapi.json`). */
export const REST_REFERENCE_HREF = "/api/v1/docs";

export const MCP_REFERENCE_HREF = "/developers/reference/mcp";

type SlugInput = { slug: string };

/** Narrows a URL segment to a known guide; `undefined` means 404. */
export function findGuidePage({ slug }: SlugInput) {
  return GUIDE_PAGES.find((page) => page === slug);
}

/** Narrows a URL segment to a developer page below `/developers`; `undefined` means 404. */
export function findDeveloperPage({ slug }: SlugInput) {
  return DEVELOPER_PAGES.slice(1).find((page) => page === slug);
}

export function guideHref({ slug }: SlugInput): string {
  return `/support/${slug}`;
}

export function developerHref({ slug }: SlugInput): string {
  return slug === DEVELOPER_PAGES[0] ? "/developers" : `/developers/${slug}`;
}
