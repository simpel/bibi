import { cva, type VariantProps } from "class-variance-authority";
import { Checkbox } from "../checkbox/checkbox";
import type { ChoiceControlProps } from "./control-props";

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
  };

/** MULTI_CHOICE field: a checkbox per allowed value. */
export function MultiChoiceControl(props: MultiChoiceControlProps) {
  const { value, onChange, choices, id, columns, emptyLabel, disabled, ...aria } = props;
  const toggle = ({ choice, checked }: { choice: string; checked: boolean }) =>
    onChange(checked ? [...value, choice] : value.filter((item) => item !== choice));
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
            disabled={disabled}
            onCheckedChange={(checked) => toggle({ choice, checked: checked === true })}
          />
          <label htmlFor={`${id}-${choice}`}>{label}</label>
        </div>
      ))}
    </fieldset>
  );
}
