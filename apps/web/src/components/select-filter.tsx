"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";

export type SelectFilterProps = {
  label: string;
  allLabel: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  /** `undefined` = the "all" option. */
  onChange: (value: string | undefined) => void;
};

const ALL = "all";

/** A filter dropdown with an "all" entry; reports `undefined` for "all". */
export function SelectFilter({ label, allLabel, value, options, onChange }: SelectFilterProps) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) => onChange(next === ALL ? undefined : next)}
    >
      <SelectTrigger className="w-44" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
