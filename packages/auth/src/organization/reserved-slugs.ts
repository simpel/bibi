/**
 * Path segments an organization slug may never take (ADR 0062): every unscoped top-level route
 * under `/:locale`, Next internals, the locales, and app segments kept free to avoid confusing
 * URLs. A web test fails when a new top-level route is missing here.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "login",
  "sign-up",
  "accept-invitation",
  "oauth",
  "docs",
  "mothership",
  "pay",
  "site",
  "welcome",
  "select-organization",
  "onboarding",
  "api",
  "_next",
  "_vercel",
  "sv",
  "en",
  "new",
  "admin",
  "settings",
  "profile",
]);

/**
 * The slug is also the organization's inbox address (`<slug>@MAIL_INBOUND_DOMAIN`, ADR 0083,
 * 0085), so it may never look like an order's reply address (`order-<id>@`).
 */
export const RESERVED_SLUG_PREFIXES: readonly string[] = ["order-"];

export type IsReservedSlugInput = { slug: string };

/** Whether `slug` collides with a reserved path segment or prefix (case-insensitive). */
export function isReservedSlug({ slug }: IsReservedSlugInput): boolean {
  const lower = slug.toLowerCase();
  return RESERVED_SLUGS.has(lower) || RESERVED_SLUG_PREFIXES.some((p) => lower.startsWith(p));
}
