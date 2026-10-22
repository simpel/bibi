"use client";

import { Link as IntlLink } from "@bibi/i18n/navigation";
import type { ComponentProps } from "react";
import { scopeHref } from "./org-path";
import { useOrgSlug } from "./use-org-slug";

export type LinkProps = ComponentProps<typeof IntlLink> & {
  /** Link into this organization instead of the current one (ADR 0062). */
  org?: string;
};

/** next-intl `Link` that prefixes scoped paths with the organization slug (ADR 0062). */
export function Link({ href, org, ...props }: LinkProps) {
  const current = useOrgSlug();
  const scoped = scopeHref({ href, org: org ?? current, force: org !== undefined });
  return <IntlLink {...props} href={scoped} />;
}
