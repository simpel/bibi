import { Checkbox } from "@okazi/ui";
import type { ControlProps } from "./control-props";

/** BOOLEAN field: a checkbox (the label lives in the field's `FormLabel`). */
export function BooleanControl({ value, onChange, ...aria }: ControlProps<boolean>) {
  return <Checkbox checked={value} onCheckedChange={(next) => onChange(next === true)} {...aria} />;
}
