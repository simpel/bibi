import {
  Button,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  MultiChoiceControl,
} from "@okazi/ui";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";

export type ChoiceGroupRowProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  index: number;
  /** The item's current parts, the options a group can offer. */
  options: { value: string; label: string }[];
  onRemove: () => void;
};

/** One choice group: name, how many to pick, and which parts are the options. */
export function ChoiceGroupRow({ form, index, options, onRemove }: ChoiceGroupRowProps) {
  const t = useTranslations("item.choiceGroups");
  const name = `choiceGroups.${index}` as const;
  return (
    <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-3">
      <TextField form={form} name={`${name}.name`} label={t("name")} />
      <TextField form={form} name={`${name}.minPick`} label={t("minPick")} type="number" />
      <TextField form={form} name={`${name}.maxPick`} label={t("maxPick")} type="number" />
      <FormController
        control={form.control}
        name={`${name}.itemIds`}
        render={({ field }) => (
          <FormItem className="sm:col-span-3">
            <FormLabel>{t("options")}</FormLabel>
            <FormControl>
              <MultiChoiceControl
                value={field.value}
                onChange={field.onChange}
                choices={options}
                emptyLabel={t("noOptions")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex justify-end sm:col-span-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={t("remove")}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
