import { Input } from "../input/input";
import type { ControlProps } from "./control-props";

export type DateControlProps = ControlProps<string>;

/** DATE field: a native date input (YYYY-MM-DD, as core stores it). */
export function DateControl({ value, onChange, ...aria }: DateControlProps) {
  return (
    <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} {...aria} />
  );
}
