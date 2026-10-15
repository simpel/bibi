import { Input } from "@okazi/ui";
import type { ControlProps } from "./control-props";

/** DATE field: a native date input (YYYY-MM-DD, as core stores it). */
export function DateControl({ value, onChange, ...aria }: ControlProps<string>) {
  return (
    <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} {...aria} />
  );
}
