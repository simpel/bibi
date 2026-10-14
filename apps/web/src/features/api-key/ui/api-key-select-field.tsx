import type { ApiKeyCreateInput } from "@okazi/core";
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
} from "@okazi/ui";
import type { Control } from "react-hook-form";
import type { ApiKeyFormValues } from "./api-key-form-schema";

export type ApiKeySelectFieldProps = {
  control: Control<ApiKeyFormValues, unknown, ApiKeyCreateInput>;
  name: "role" | "expires";
  label: string;
  placeholder?: string;
  options: readonly { value: string; label: string }[];
};

/** A select in the create form (the key's role or its expiry). */
export function ApiKeySelectField({
  control,
  name,
  label,
  placeholder,
  options,
}: ApiKeySelectFieldProps) {
  return (
    <FormController
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
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
