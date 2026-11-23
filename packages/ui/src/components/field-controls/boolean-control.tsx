import { Switch } from "../switch/switch";
import type { ControlProps } from "./control-props";

export type BooleanControlProps = ControlProps<boolean>;

/** BOOLEAN field: a switch; the field's label sits beside it (`FieldController`). */
export function BooleanControl({ value, onChange, ...aria }: BooleanControlProps) {
  return <Switch checked={value} onCheckedChange={(next) => onChange(next === true)} {...aria} />;
}
