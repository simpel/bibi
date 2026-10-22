import { redirect as intlRedirect } from "@bibi/i18n/navigation";
import { scopeHref } from "./org-path";
import { Link as ScopedLink, type LinkProps as ScopedLinkProps } from "./scoped-link";
import {
  type NavigateOptions as ScopedNavigateOptions,
  usePathname as useScopedPathname,
  useRouter as useScopedRouter,
} from "./scoped-router";
import { useOrgSlug as useCurrentOrgSlug } from "./use-org-slug";

// Client modules: server components may import them (Link renders; hooks are client-only).
export const Link = ScopedLink;
export type LinkProps = ScopedLinkProps;
export const useRouter = useScopedRouter;
export type NavigateOptions = ScopedNavigateOptions;
export const usePathname = useScopedPathname;
export const useOrgSlug = useCurrentOrgSlug;

export type RedirectInput = Parameters<typeof intlRedirect>[0] & {
  /** The organization slug to prefix scoped paths with (server code has no URL params). */
  org?: string;
};

/**
 * next-intl `redirect` (ADR 0062). With `org` the path is always prefixed, as for `Link` and
 * `useRouter` with an explicit organization, so `/welcome/profile` becomes `/<org>/welcome/profile`.
 */
export function redirect({ org, href, ...rest }: RedirectInput): never {
  return intlRedirect({ ...rest, href: scopeHref({ href, org, force: org !== undefined }) });
}
