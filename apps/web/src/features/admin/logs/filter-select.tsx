import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";

export const ALL = "all";

export type FilterSelectProps = {
  label: string;
  allLabel: string;
  value: string | undefined;
  options: readonly { value: string; label: string }[];
  onChange: (value: string | null) => void;
  className?: string;
};

/** A select with an "all" entry that maps to "no filter" (`null`). */
export function FilterSelect(props: FilterSelectProps) {
  return (
    <Select
      value={props.value ?? ALL}
      onValueChange={(value) => props.onChange(value === ALL ? null : value)}
    >
      <SelectTrigger className={props.className} aria-label={props.label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{props.allLabel}</SelectItem>
        {props.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
