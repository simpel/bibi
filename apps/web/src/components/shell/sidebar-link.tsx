export type IsActiveInput = { pathname: string; href: string };

export function isActive({ pathname, href }: IsActiveInput): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type ActiveHrefInput = { pathname: string; hrefs: readonly string[] };

/**
 * The one entry to highlight: the most specific active href, so `/settings/members` lights up
 * Members, not Settings as well.
 */
export function activeHref({ pathname, hrefs }: ActiveHrefInput): string | null {
  const active = hrefs.filter((href) => isActive({ pathname, href }));
  return active.sort((a, b) => b.length - a.length)[0] ?? null;
}
