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
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import { type ItemFormValues, NO_VENUE } from "./item-form-values";

export type ItemCoreFieldsProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  venues: ItemFormData["venues"];
  /** The caller may not view venues: the select is disabled and reads "Hidden". */
  venuesHidden: boolean;
};

/** Name, description and the optional venue select (the type select lives in `ItemTypeField`). */
export function ItemCoreFields({ form, venues, venuesHidden }: ItemCoreFieldsProps) {
  const t = useTranslations("item.fields");
  const common = useTranslations("common");
  return (
    <>
      <TextField form={form} name="name" label={t("name")} required />
      <TextField form={form} name="description" label={t("description")} multiline />
      <FormController
        control={form.control}
        name="venueId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("venue")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange} disabled={venuesHidden}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={venuesHidden ? common("hidden") : undefined} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NO_VENUE}>{t("noVenue")}</SelectItem>
                {venues.map(({ id, name }) => (
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
    </>
  );
}
