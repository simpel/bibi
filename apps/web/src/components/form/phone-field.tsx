import {
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  PhoneInput,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

export type PhoneFieldProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * shadcn form field (label, control, `FormMessage`) for phone numbers with auto-formatting
 * and interactive country code picker. Must be rendered inside `<Form {...form}>`.
 */
export function PhoneField<V extends FieldValues, O>({
  form,
  name,
  label,
  autoComplete = "tel",
  required,
  placeholder,
  disabled,
}: PhoneFieldProps<V, O>) {
  const tPhone = useTranslations("phone");
  const tCountry = useTranslations("country");

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
            <PhoneInput
              name={field.name}
              ref={field.ref}
              value={String(field.value ?? "")}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              autoComplete={autoComplete}
              placeholder={placeholder}
              searchPlaceholder={tPhone("searchCountry")}
              emptyText={tCountry("empty")}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
