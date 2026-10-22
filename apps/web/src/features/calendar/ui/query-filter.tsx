"use client";

import { usePathname, useRouter } from "@bibi/i18n/navigation";
import { SelectFilter } from "@/components/select-filter";

export type QueryFilterProps = {
  /** The query key this filter owns, e.g. `venue` or `type`. */
  name: string;
  label: string;
  allLabel: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  /** The query value for the "all" entry; without it, "all" drops the key. */
  allValue?: string;
  /** The current query without `name`; the filter adds or drops it. */
  query: Record<string, string>;
};

/** A dropdown as URL state (a navigation filter: no server action, no toast). */
export function QueryFilter({ name, allValue, query, ...select }: QueryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const go = ({ value }: { value: string | undefined }) =>
    router.replace({ pathname, query: value ? { ...query, [name]: value } : query });
  return <SelectFilter {...select} onChange={(next) => go({ value: next ?? allValue })} />;
}
