import { Input } from "../input/input";
import type { ControlProps } from "./control-props";

export type TextControlProps = ControlProps<string>;

/** TEXT field: a plain text input. */
export function TextControl({ value, onChange, ...aria }: TextControlProps) {
  return <Input value={value} onChange={(event) => onChange(event.target.value)} {...aria} />;
}
