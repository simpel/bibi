"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@okazi/ui";

export type SkillSelectFilterProps = {
  label: string;
  allLabel: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  /** `undefined` = the "all" option. */
  onChange: (value: string | undefined) => void;
};

const ALL = "all";

/** A filter dropdown with an "all" entry; reports `undefined` for "all". */
export function SkillSelectFilter({
  label,
  allLabel,
  value,
  options,
  onChange,
}: SkillSelectFilterProps) {
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
