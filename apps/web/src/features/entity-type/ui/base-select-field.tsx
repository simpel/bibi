import { ENTITY_BASES } from "@okazi/core/schemas";
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
import type { EntityTypeFormOutput, EntityTypeFormValues } from "./entity-type-form-schema";

export type BaseSelectFieldProps = {
  control: Control<EntityTypeFormValues, unknown, EntityTypeFormOutput>;
};

/** Which kind of record the type classifies (chosen once, on create). */
export function BaseSelectField({ control }: BaseSelectFieldProps) {
  const t = useTranslations("entityType");
  return (
    <FormController
      control={control}
      name="base"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.base")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {ENTITY_BASES.map((base) => (
                <SelectItem key={base} value={base}>
                  {t(`bases.${base}`)}
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
