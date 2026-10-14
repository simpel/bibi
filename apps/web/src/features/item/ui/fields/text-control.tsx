import { Input } from "@okazi/ui";
import type { ControlProps } from "./control-props";

/** TEXT field: a plain text input. */
export function TextControl({ value, onChange, ...aria }: ControlProps<string>) {
  return <Input value={value} onChange={(event) => onChange(event.target.value)} {...aria} />;
}
