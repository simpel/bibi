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
import { useTranslations } from "next-intl";
import type { Control, FieldValues, Path } from "react-hook-form";
import type { NamedOption } from "./booking-form-data";

/** Select value standing for "no one" (a Select item cannot have an empty value). */
export const NONE = "none";

export type OptionSelectFieldProps<V extends FieldValues, O> = {
  control: Control<V, unknown, O>;
  name: Path<V>;
  label: string;
  options: readonly NamedOption[];
  /** Label of an extra "no one" choice (value `NONE`); omitted = a choice is required. */
  noneLabel?: string;
};

/** A shadcn select of named options (customers, members) bound to one form field. */
export function OptionSelectField<V extends FieldValues, O>({
  control,
  name,
  label,
  options,
  noneLabel,
}: OptionSelectFieldProps<V, O>) {
  const t = useTranslations("common");
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
                <SelectValue placeholder={t("select")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {noneLabel ? <SelectItem value={NONE}>{noneLabel}</SelectItem> : null}
              {options.map(({ id, name: optionName }) => (
                <SelectItem key={id} value={id}>
                  {optionName}
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
