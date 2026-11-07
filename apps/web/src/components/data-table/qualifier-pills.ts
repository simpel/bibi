import type { QuickFilterPill } from "./table-filter-bar";

export type QualifierPillValue = { key: string; label: string };

export type QualifierPillsInput = {
  /** Label of the leading "All" pill. */
  allLabel: string;
  /** The qualifier the pills filter by (`type:`, `status:`, ...). */
  qualifier: string;
  values: readonly QualifierPillValue[];
};

/** Quick-filter pills for a column with a few values: "All" plus one `qualifier:value` pill each. */
export function qualifierPills({
  allLabel,
  qualifier,
  values,
}: QualifierPillsInput): QuickFilterPill[] {
  return [
    { key: "all", label: allLabel, query: undefined },
    ...values.map(({ key, label }) => ({
      key,
      label,
      query: label.includes(" ") ? `${qualifier}:"${label}"` : `${qualifier}:${label}`,
    })),
  ];
}
