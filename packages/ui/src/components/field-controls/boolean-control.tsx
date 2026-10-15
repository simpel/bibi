import { Checkbox } from "../checkbox/checkbox";
import type { ControlProps } from "./control-props";

export type BooleanControlProps = ControlProps<boolean>;

/** BOOLEAN field: a checkbox (the label lives in the field's label). */
export function BooleanControl({ value, onChange, ...aria }: BooleanControlProps) {
  return <Checkbox checked={value} onCheckedChange={(next) => onChange(next === true)} {...aria} />;
}
