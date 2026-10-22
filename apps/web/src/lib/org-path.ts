import { RESERVED_SLUGS } from "@bibi/auth/reserved-slugs";
import { LOCALES } from "@bibi/i18n";

/** Reserved segments that are app routes inside an organization, not top-level pages. */
export const SCOPED_RESERVED_SEGMENTS: ReadonlySet<string> = new Set([
  "admin",
  "settings",
  "profile",
  "new",
]);

/** First path segments that live outside `/:org` (login, docs, pay...; ADR 0062). */
export const UNSCOPED_SEGMENTS: ReadonlySet<string> = new Set(
  [...RESERVED_SLUGS].filter((segment) => !SCOPED_RESERVED_SEGMENTS.has(segment)),
);

export type PathInput = { path: string };

const firstSegment = ({ path }: PathInput): string => path.slice(1).split(/[/?#]/, 1)[0] ?? "";

/** Whether an app-relative path (`/pipeline`, `/new/venue?x=1`) belongs under an organization. */
export function isScopedPath({ path }: PathInput): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  return !UNSCOPED_SEGMENTS.has(firstSegment({ path }));
}

export type OrgPathInput = { path: string; org: string };

/** `/pipeline` → `/<org>/pipeline`, `/` → `/<org>`, `/?q=1` → `/<org>?q=1`. Always prefixes. */
export function orgPath({ path, org }: OrgPathInput): string {
  const rest =
    path === "/" ? "" : path.startsWith("/?") || path.startsWith("/#") ? path.slice(1) : path;
  return `/${org}${rest}`;
}

export type ScopePathInput = { path: string; org: string | undefined };

/** Prefixes scoped paths with the organization; unscoped and external paths stay as they are. */
export function scopePath({ path, org }: ScopePathInput): string {
  if (!org || !isScopedPath({ path })) return path;
  return orgPath({ path, org });
}

export type StripOrgInput = { pathname: string; org: string | undefined };

/** `/<org>/pipeline` → `/pipeline`, so path parsers see the same paths as `ROUTES`. */
export function stripOrg({ pathname, org }: StripOrgInput): string {
  if (!org) return pathname;
  if (pathname === `/${org}`) return "/";
  return pathname.startsWith(`/${org}/`) ? pathname.slice(org.length + 1) : pathname;
}

/** A navigation target: a path, or an object with a pathname (`{ pathname, query }`). */
export type HrefLike = string | { pathname?: string | null };

export type ScopeHrefInput<H extends HrefLike> = {
  href: H;
  /** The organization slug; `undefined` outside `/:org` leaves the href as is. */
  org: string | undefined;
  /** An explicitly chosen organization: prefix the path even when it names a top-level page. */
  force?: boolean;
};

/** `scopePath` for both href shapes that `Link` and `useRouter` accept. */
export function scopeHref<H extends HrefLike>({ href, org, force = false }: ScopeHrefInput<H>): H {
  const map = ({ path }: PathInput) =>
    force && org ? orgPath({ path, org }) : scopePath({ path, org });
  if (typeof href === "string") return map({ path: href }) as H;
  const target: { pathname?: string | null } = href;
  if (!target.pathname) return href;
  return { ...target, pathname: map({ path: target.pathname }) } as H;
}

export type PathnameInput = { pathname: string };

/** The organization slug of `/:locale/:slug/...`, unless the segment is reserved (a page). */
export function orgSlugFromPathname({ pathname }: PathnameInput): string | undefined {
  const [, locale, slug] = pathname.split("/");
  if (!locale || !slug || !(LOCALES as readonly string[]).includes(locale)) return undefined;
  return RESERVED_SLUGS.has(slug.toLowerCase()) ? undefined : slug;
}
