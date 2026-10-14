import { PRICE_UNITS } from "@okazi/core/schemas";
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
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type PriceSectionProps = { form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput> };

type PriceUnitFieldProps = {
  control: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>["control"];
};

function PriceUnitField({ control }: PriceUnitFieldProps) {
  const t = useTranslations("item");
  return (
    <FormController
      control={control}
      name="priceUnit"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.priceUnit")}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PRICE_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {t(`priceUnits.${unit}`)}
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

/** PRICED behaviour: price in kr (stored as minor units), price unit and VAT (empty = the venue default). */
export function PriceSection({ form }: PriceSectionProps) {
  const t = useTranslations("item");
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-2 text-sm font-semibold">{t("sections.price")}</legend>
      <div className="grid grid-cols-2 gap-4">
        <TextField form={form} name="price" label={t("fields.price")} type="number" step="any" />
        <PriceUnitField control={form.control} />
      </div>
      <TextField
        form={form}
        name="vatRatePercent"
        label={t("fields.vatRatePercent")}
        type="number"
      />
    </fieldset>
  );
}
