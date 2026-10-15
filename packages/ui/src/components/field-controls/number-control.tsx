import { Input } from "../input/input";
import type { ControlProps } from "./control-props";

export type NumberControlProps = ControlProps<string>;

/** NUMBER field: a decimal input; the string is parsed by the form schema. */
export function NumberControl({ value, onChange, ...aria }: NumberControlProps) {
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
