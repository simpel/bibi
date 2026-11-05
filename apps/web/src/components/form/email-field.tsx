import {
  EmailInput,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
} from "@bibi/ui";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

export type EmailFieldProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * shadcn form field (label, control, `FormMessage`) for emails with space blocking and auto-cleaning.
 * Must be rendered inside `<Form {...form}>`.
 */
export function EmailField<V extends FieldValues, O>({
  form,
  name,
  label,
  autoComplete = "email",
  required,
  placeholder,
  disabled,
}: EmailFieldProps<V, O>) {
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
            <EmailInput
              name={field.name}
              ref={field.ref}
              value={String(field.value ?? "")}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              autoComplete={autoComplete}
              placeholder={placeholder}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
