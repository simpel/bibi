import {
  Checkbox,
  FormControl,
  FormController,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@bibi/ui";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

export type CheckFieldProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
  /** One line of help under the label. */
  description?: string;
  disabled?: boolean;
  /** Called after the field changes, e.g. to refill a dependent field. */
  onChange?: (input: { checked: boolean }) => void;
};

/** shadcn form field for a boolean (Checkbox). Must be rendered inside `<Form {...form}>`. */
export function CheckField<V extends FieldValues, O>({
  form,
  name,
  label,
  description,
  disabled,
  onChange,
}: CheckFieldProps<V, O>) {
  return (
    <FormController
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={
            description
              ? "grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0.5"
              : "flex flex-row items-center gap-2"
          }
        >
          <FormControl>
            <Checkbox
              checked={field.value === true}
              disabled={disabled}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                onChange?.({ checked: checked === true });
              }}
            />
          </FormControl>
          <FormLabel>{label}</FormLabel>
          {description ? (
            <FormDescription className="col-start-2">{description}</FormDescription>
          ) : null}
          <FormMessage className={description ? "col-start-2" : undefined} />
        </FormItem>
      )}
    />
  );
}
