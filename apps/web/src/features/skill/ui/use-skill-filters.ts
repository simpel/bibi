"use client";

import { usePathname, useRouter } from "@bibi/i18n/navigation";
import { type SkillFilters, skillFilterQuery } from "../skill-filters";

/** Applying filters = replacing the URL query; the server component re-renders the list. */
export function useSkillFilters({ filters }: { filters: SkillFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  return ({ next }: { next: Partial<SkillFilters> }) => {
    const merged = { ...filters, cursor: undefined, ...next };
    router.replace({ pathname, query: skillFilterQuery({ filters: merged }) });
  };
}
