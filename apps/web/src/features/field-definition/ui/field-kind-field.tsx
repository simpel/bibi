import { FIELD_KINDS } from "@okazi/core/schemas";
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
import type { Control } from "react-hook-form";
import type { FieldFormOutput, FieldFormValues } from "./field-form-schema";

export type FieldKindFieldProps = { control: Control<FieldFormValues, unknown, FieldFormOutput> };

/** The value kind of the field (text, number, yes/no, date, choice, multiple choice). */
export function FieldKindField({ control }: FieldKindFieldProps) {
  const t = useTranslations("fieldDefinition");
  return (
    <FormController
      control={control}
      name="kind"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.kind")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {FIELD_KINDS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`kinds.${value}`)}
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
