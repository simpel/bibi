"use client";

import { usePathname as useIntlPathname, useRouter as useIntlRouter } from "@bibi/i18n/navigation";
import { useMemo } from "react";
import { scopeHref, stripOrg } from "./org-path";
import { useOrgSlug } from "./use-org-slug";

type IntlRouter = ReturnType<typeof useIntlRouter>;
type IntlHref = Parameters<IntlRouter["push"]>[0];

/** Router options plus `org`: navigate into that organization instead of the current one. */
export type NavigateOptions = NonNullable<Parameters<IntlRouter["push"]>[1]> & { org?: string };
export type PrefetchOptions = NonNullable<Parameters<IntlRouter["prefetch"]>[1]> & { org?: string };

type ScopeInput<O extends { org?: string }> = { href: IntlHref; options: O | undefined };

/**
 * next-intl `useRouter` whose `push`, `replace` and `prefetch` prefix scoped paths with the
 * organization slug of the current URL, or with `options.org` (ADR 0062).
 */
export function useRouter() {
  const router = useIntlRouter();
  const current = useOrgSlug();
  return useMemo(() => {
    const scope = <O extends { org?: string }>({ href, options }: ScopeInput<O>) => {
      const { org, ...rest } = options ?? ({} as O);
      const scoped = scopeHref({ href, org: org ?? current, force: org !== undefined });
      return { scoped, rest };
    };
    return {
      ...router,
      push: (href: IntlHref, options?: NavigateOptions) => {
        const { scoped, rest } = scope({ href, options });
        router.push(scoped, rest);
      },
      replace: (href: IntlHref, options?: NavigateOptions) => {
        const { scoped, rest } = scope({ href, options });
        router.replace(scoped, rest);
      },
      prefetch: (href: IntlHref, options?: PrefetchOptions) => {
        const { scoped, rest } = scope({ href, options });
        router.prefetch(scoped, rest);
      },
    };
  }, [router, current]);
}

/** The pathname without locale and organization slug, comparable with `ROUTES`. */
export function usePathname(): string {
  return stripOrg({ pathname: useIntlPathname(), org: useOrgSlug() });
}
