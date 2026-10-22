import { Checkbox, Label } from "@bibi/ui";
import type { TypeChoice } from "../../lib/setup-draft";

export type TypeChoiceListProps = {
  rows: [TypeChoice, number][];
  onToggle: ({ index, checked }: { index: number; checked: boolean }) => void;
};

/** The types as checkboxes; `index` is the position in the whole draft. */
export function TypeChoiceList({ rows, onToggle }: TypeChoiceListProps) {
  return (
    <ul className="grid gap-2 rounded-lg border p-4">
      {rows.map(([type, index]) => (
        <li key={`${type.name}-${index}`} className="flex items-center gap-3">
          <Checkbox
            id={`type-${index}`}
            checked={type.checked}
            onCheckedChange={(value) => onToggle({ index, checked: value === true })}
          />
          <Label htmlFor={`type-${index}`}>{type.name}</Label>
        </li>
      ))}
    </ul>
  );
}
