/** Props every field control takes; the aria props come from `FormControl` (id, aria-invalid, ...). */
export type ControlProps<V> = {
  value: V;
  onChange: (value: V) => void;
  id?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export type ControlChoice = { value: string; label: string };

export type ChoiceControlProps<V> = ControlProps<V> & { choices: ControlChoice[] };
