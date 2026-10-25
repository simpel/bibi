import {
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bibi/ui";
import type { Control, FieldValues, Path } from "react-hook-form";

export type FormatSelectOption = { value: string; label: string };

export type FormatSelectFieldProps<V extends FieldValues, O> = {
  control: Control<V, unknown, O>;
  name: Path<V>;
  label: string;
  options: readonly FormatSelectOption[];
};

/** A shadcn select of ready-made labels (live examples) bound to one form field. */
export function FormatSelectField<V extends FieldValues, O>(props: FormatSelectFieldProps<V, O>) {
  const { control, name, label, options } = props;
  return (
    <FormController
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={String(field.value ?? "")} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
