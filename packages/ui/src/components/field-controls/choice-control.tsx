import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select/select";
import type { ChoiceControlProps } from "./control-props";

export type ChoiceControlComponentProps = ChoiceControlProps<string> & {
  /** Shown while nothing is selected (localised by the caller). */
  placeholder?: string;
};

/** CHOICE field: one value from a list or own options. */
export function ChoiceControl(props: ChoiceControlComponentProps) {
  const { value, onChange, choices, placeholder, disabled, ...aria } = props;
  return (
    <Select value={value === "" ? undefined : value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger {...aria}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {choices.map(({ value: choice, label }) => (
          <SelectItem key={choice} value={choice}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
