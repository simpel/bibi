import type { PriceEffect } from "@bibi/core/schemas";
import {
  Button,
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
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

type OptionPath = `customisationGroups.${number}.options.${number}`;

export type CustomisationOptionRowProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  name: OptionPath;
  items: ItemFormData["parts"];
  onRemove: () => void;
};

const EFFECTS: PriceEffect[] = ["INCLUDED", "EXTRA", "REPLACES"];

type ChoiceSelectProps = {
  form: CustomisationOptionRowProps["form"];
  name: `${OptionPath}.itemId` | `${OptionPath}.priceEffect`;
  label: string;
  placeholder?: string;
  choices: { value: string; label: string }[];
};

function ChoiceSelect({ form, name, label, placeholder, choices }: ChoiceSelectProps) {
  return (
    <FormController
      control={form.control}
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
              {choices.map(({ value, label: text }) => (
                <SelectItem key={value} value={value}>
                  {text}
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

/** One option: which item, and what choosing it does to the price. */
export function CustomisationOptionRow({
  form,
  name,
  items,
  onRemove,
}: CustomisationOptionRowProps) {
  const t = useTranslations("item");
  const effects = useTranslations("priceEffect");
  return (
    <div className="grid items-end gap-2 sm:grid-cols-[2fr_1fr_auto]">
      <ChoiceSelect
        form={form}
        name={`${name}.itemId`}
        label={t("customisationGroups.option")}
        placeholder={t("select")}
        choices={items.map(({ id, name: label }) => ({ value: id, label }))}
      />
      <ChoiceSelect
        form={form}
        name={`${name}.priceEffect`}
        label={t("customisationGroups.priceEffect")}
        choices={EFFECTS.map((effect) => ({ value: effect, label: effects(effect) }))}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={t("customisationGroups.removeOption")}
      >
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  );
}
