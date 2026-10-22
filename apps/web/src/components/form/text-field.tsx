import {
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from "@bibi/ui";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

export type TextFieldProps<V extends FieldValues, O> = {
  form: UseFormReturn<V, unknown, O>;
  name: Path<V>;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "password" | "date" | "datetime-local" | "color";
  autoComplete?: string;
  multiline?: boolean;
  required?: boolean;
  step?: string;
  rows?: number;
};

/**
 * shadcn form field (label, control, `FormMessage`) for text, number and multi-line input.
 * Must be rendered inside `<Form {...form}>` (CLAUDE.md "Forms").
 */
export function TextField<V extends FieldValues, O>(props: TextFieldProps<V, O>) {
  const { form, name, label, type = "text", multiline = false, required, step, rows = 3 } = props;
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
            {multiline ? (
              <Textarea rows={rows} {...field} value={field.value ?? ""} />
            ) : (
              <Input
                type={type}
                step={step}
                autoComplete={props.autoComplete}
                inputMode={type === "number" ? "decimal" : undefined}
                {...field}
                value={field.value ?? ""}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
