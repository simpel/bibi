import type { FieldChoice } from "../field-specs";

/** Props every field control takes; `aria` props come from `FormControl` (id, aria-invalid, ...). */
export type ControlProps<V> = {
  value: V;
  onChange: (value: V) => void;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export type ChoiceControlProps<V> = ControlProps<V> & { choices: FieldChoice[] };
