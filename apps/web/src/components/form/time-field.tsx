import { FormControl, FormController, FormItem, FormLabel, FormMessage, TimeInput } from "@bibi/ui";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

export type TimeFieldProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
  required?: boolean;
};

/** A form field for a time of day (`HH:mm`) typed with the keyboard (`TimeInput`). */
export function TimeField<V extends FieldValues, O>({
  form,
  name,
  label,
  required,
}: TimeFieldProps<V, O>) {
  return (
    <FormController
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required ? <span className="ml-0.5 text-destructive">*</span> : null}
          </FormLabel>
          <FormControl>
            <TimeInput
              width="full"
              name={field.name}
              ref={field.ref}
              value={String(field.value ?? "")}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
