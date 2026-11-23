import { PlusIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../select/select";
import type { ChoiceControlProps } from "./control-props";

/** The value of the "create" entry; never a real choice. */
const CREATE = "__create__";

export type ChoiceControlComponentProps = ChoiceControlProps<string> & {
  /** Shown while nothing is selected (localised by the caller). */
  placeholder?: string;
  /** A last entry that creates a new choice, e.g. "Create value"; it calls `onCreate`. */
  createLabel?: string;
  onCreate?: () => void;
};

/** CHOICE field: one value from a list or own options, optionally with a "create" entry last. */
export function ChoiceControl(props: ChoiceControlComponentProps) {
  const { value, onChange, choices, placeholder, disabled, createLabel, onCreate, ...aria } = props;
  return (
    <Select
      value={value === "" ? undefined : value}
      onValueChange={(next) => (next === CREATE ? onCreate?.() : onChange(next))}
      disabled={disabled}
    >
      <SelectTrigger {...aria}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {choices.map(({ value: choice, label }) => (
          <SelectItem key={choice} value={choice}>
            {label}
          </SelectItem>
        ))}
        {createLabel && onCreate ? (
          <>
            {choices.length ? <SelectSeparator /> : null}
            <SelectItem value={CREATE}>
              <PlusIcon />
              {createLabel}
            </SelectItem>
          </>
        ) : null}
      </SelectContent>
    </Select>
  );
}
