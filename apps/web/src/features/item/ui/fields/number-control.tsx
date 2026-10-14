import { Input } from "@okazi/ui";
import type { ControlProps } from "./control-props";

/** NUMBER field: a decimal input; the string is parsed by the form schema. */
export function NumberControl({ value, onChange, ...aria }: ControlProps<string>) {
  return (
    <Input
      type="number"
      step="any"
      inputMode="decimal"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      {...aria}
    />
  );
}
