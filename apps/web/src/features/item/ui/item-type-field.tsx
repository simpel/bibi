import type { EntityTypeDto } from "@okazi/core";
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
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type ItemTypeFieldProps = {
  control: Control<ItemFormValues, unknown, ItemFormOutput>;
  types: EntityTypeDto[];
  /** Called with the new type id after the value changed (the form resets the type's fields). */
  onTypeChange: (id: string) => void;
};

/** The item's type, chosen on create (it decides the fields and behaviours below). */
export function ItemTypeField({ control, types, onTypeChange }: ItemTypeFieldProps) {
  const t = useTranslations("item");
  return (
    <FormController
      control={control}
      name="entityTypeId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.type")}</FormLabel>
          <Select
            value={field.value}
            onValueChange={(id) => {
              field.onChange(id);
              onTypeChange(id);
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t("select")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {types.map(({ id, name }) => (
                <SelectItem key={id} value={id}>
                  {name}
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
