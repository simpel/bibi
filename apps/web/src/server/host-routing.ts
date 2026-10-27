import { routing } from "@bibi/i18n/routing";

export type HostAction =
  | { type: "pass" }
  | { type: "rewrite"; pathname: string }
  | { type: "redirect"; url: string };

export type ResolveHostActionInput = {
  /** The request's `Host` header (with the port when it is not the default one). */
  host: string;
  pathname: string;
  search: string;
  /** The public site's URL (ADR 0073). Unset: one host serves everything. */
  publicUrl: string | undefined;
  /** The app's URL (`WEB_URL`). */
  webUrl: string;
};

const SITE_PAGE = "site";

/** `/`, `/sv` and `/en` (an optional trailing slash): the public site's front page. */
function frontPageLocale({ pathname }: { pathname: string }): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return routing.defaultLocale;
  const [first] = segments;
  const isLocale = (routing.locales as readonly string[]).includes(first ?? "");
  return segments.length === 1 && isLocale ? (first ?? null) : null;
}

type RedirectInput = Pick<ResolveHostActionInput, "pathname" | "search"> & { base: string };

function redirectTo({ base, pathname, search }: RedirectInput): HostAction {
  return { type: "redirect", url: new URL(`${pathname}${search}`, base).toString() };
}

/**
 * Which host a request came in on decides what it gets (ADR 0073). The apex serves the public
 * site and sends everything else to the app host. Any other host (`www.`, the redirect domain)
 * goes to the apex. The app host is untouched. Without `publicUrl` nothing changes.
 */
export function resolveHostAction({
  host,
  pathname,
  search,
  publicUrl,
  webUrl,
}: ResolveHostActionInput): HostAction {
  if (!publicUrl) return { type: "pass" };
  const requestHost = host.toLowerCase();
  if (requestHost === new URL(webUrl).host) return { type: "pass" };
  if (requestHost !== new URL(publicUrl).host) {
    return redirectTo({ base: publicUrl, pathname, search });
  }
  const locale = frontPageLocale({ pathname });
  if (locale) return { type: "rewrite", pathname: `/${locale}/${SITE_PAGE}` };
  return redirectTo({ base: webUrl, pathname, search });
}

export type IsPublicHostInput = { host: string; publicUrl: string | undefined };

/** Whether the request came in on the public site's own host (robots, sitemap). */
export function isPublicHost({ host, publicUrl }: IsPublicHostInput): boolean {
  return publicUrl !== undefined && host.toLowerCase() === new URL(publicUrl).host;
}
