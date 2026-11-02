import { cva, type VariantProps } from "class-variance-authority";
import { Checkbox } from "../checkbox/checkbox";
import type { ChoiceControlProps } from "./control-props";
import { toggleChoice } from "./toggle-choice";

export const multiChoiceVariants = cva("grid gap-2 border-0 p-0", {
  variants: {
    columns: { 1: "", 2: "sm:grid-cols-2" },
  },
  defaultVariants: { columns: 2 },
});

export type MultiChoiceControlProps = ChoiceControlProps<string[]> &
  VariantProps<typeof multiChoiceVariants> & {
    /** Shown when there is nothing to choose from (localised by the caller). */
    emptyLabel?: string;
    /** At most this many: 1 makes a new pick replace the old one, more locks the rest. */
    max?: number;
  };

/** MULTI_CHOICE field: a checkbox per allowed value. */
export function MultiChoiceControl(props: MultiChoiceControlProps) {
  const { value, onChange, choices, id, columns, emptyLabel, disabled, max, ...aria } = props;
  const toggle = ({ choice, checked }: { choice: string; checked: boolean }) =>
    onChange(toggleChoice({ value, choice, checked, max }));
  const full = max !== undefined && max > 1 && value.length >= max;
  if (choices.length === 0) {
    return emptyLabel ? <p className="text-sm text-muted-foreground">{emptyLabel}</p> : null;
  }
  return (
    <fieldset id={id} className={multiChoiceVariants({ columns })} {...aria}>
      {choices.map(({ value: choice, label }) => (
        <div key={choice} className="flex items-center gap-2 text-sm">
          <Checkbox
            id={`${id}-${choice}`}
            checked={value.includes(choice)}
            disabled={disabled || (full && !value.includes(choice))}
            onCheckedChange={(checked) => toggle({ choice, checked: checked === true })}
          />
          <label htmlFor={`${id}-${choice}`}>{label}</label>
        </div>
      ))}
    </fieldset>
  );
}
