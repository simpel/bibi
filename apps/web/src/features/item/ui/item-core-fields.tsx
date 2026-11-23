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
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import { type ItemFormValues, NO_VENUE } from "./item-form-values";
import { ItemPictureField } from "./item-picture-field";

export type ItemCoreFieldsProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  venues: ItemFormData["venues"];
  /** The caller may not view venues: the select is disabled and reads "Hidden". */
  venuesHidden: boolean;
};

/** The optional venue select; disabled and "Hidden" without venue access. */
export function ItemVenueField({ form, venues, venuesHidden }: ItemCoreFieldsProps) {
  const t = useTranslations("item.fields");
  const common = useTranslations("common");
  return (
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
  );
}

/** Name, description, the picture and the venue (the type select lives in `ItemTypeField`). */
export function ItemCoreFields(props: ItemCoreFieldsProps) {
  const t = useTranslations("item.fields");
  const { form } = props;
  return (
    <>
      <TextField form={form} name="name" label={t("name")} required />
      <TextField form={form} name="description" label={t("description")} multiline />
      <ItemPictureField form={form} />
      <ItemVenueField {...props} />
    </>
  );
}
