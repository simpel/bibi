import { Checkbox, FormControl, FormController, FormItem, FormLabel, FormMessage } from "@okazi/ui";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

export type CheckFieldProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
  /** Called after the field changes, e.g. to refill a dependent field. */
  onChange?: (input: { checked: boolean }) => void;
};

/** shadcn form field for a boolean (Checkbox). Must be rendered inside `<Form {...form}>`. */
export function CheckField<V extends FieldValues, O>({
  form,
  name,
  label,
  onChange,
}: CheckFieldProps<V, O>) {
  return (
    <FormController
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center gap-2">
          <FormControl>
            <Checkbox
              checked={field.value === true}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                onChange?.({ checked: checked === true });
              }}
            />
          </FormControl>
          <FormLabel>{label}</FormLabel>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
