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
import type { NamedOption } from "./named-option";

/** Select value standing for "no one" (a Select item cannot have an empty value). */
export const NONE = "none";

export type OptionSelectFieldProps<V extends FieldValues, O> = {
  control: Control<V, unknown, O>;
  name: Path<V>;
  label: string;
  options: readonly NamedOption[];
  /** Label of an extra "no one" choice (value `NONE`); omitted = a choice is required. */
  noneLabel?: string;
  /** Called after the field changes, e.g. to reset a dependent field. */
  onChange?: (value: string) => void;
};

/** A shadcn select of named options (customers, members) bound to one form field. */
export function OptionSelectField<V extends FieldValues, O>(props: OptionSelectFieldProps<V, O>) {
  const { control, name, label, options, noneLabel, onChange } = props;
  const t = useTranslations("common");
  return (
    <FormController
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={String(field.value ?? "")}
            onValueChange={(value) => {
              field.onChange(value);
              onChange?.(value);
            }}
          >
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
