"use client";

import { FormField, Input, Textarea } from "@okazi/ui";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

export type TextFieldProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "password";
  autoComplete?: string;
  multiline?: boolean;
  required?: boolean;
  step?: string;
};

/** react-hook-form text/number/textarea input inside the ui FormField (label + error). */
export function TextField<V extends FieldValues, O>(props: TextFieldProps<V, O>) {
  const { form, name, label, type = "text", multiline = false, required, step } = props;
  const { autoComplete } = props;
  const error = form.formState.errors[name]?.message;
  const id = `field-${name}`;
  const common = { id, "aria-invalid": error ? true : undefined, ...form.register(name) };
  return (
    <FormField
      id={id}
      label={label}
      required={required}
      error={typeof error === "string" ? error : undefined}
    >
      {multiline ? (
        <Textarea rows={3} {...common} />
      ) : (
        <Input type={type} step={step} autoComplete={autoComplete} inputMode={type === "number" ? "decimal" : undefined} {...common} />
      )}
    </FormField>
  );
}
