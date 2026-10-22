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

export type IsReservedSlugInput = { slug: string };

/** Whether `slug` collides with a reserved path segment (case-insensitive). */
export function isReservedSlug({ slug }: IsReservedSlugInput): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
