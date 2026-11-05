import {
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  WebsiteInput,
} from "@bibi/ui";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

export type WebsiteFieldProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * shadcn form field (label, control, `FormMessage`) for website URLs with auto-prefixing on blur.
 * Must be rendered inside `<Form {...form}>`.
 */
export function WebsiteField<V extends FieldValues, O>({
  form,
  name,
  label,
  autoComplete = "url",
  required,
  placeholder,
  disabled,
}: WebsiteFieldProps<V, O>) {
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
            <WebsiteInput
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
