import {
  Combobox,
  FormControl,
  FormController,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { NONE } from "@/components/form/option-select-field";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { priceText } from "../../item/ui/price-text";
import type { LineFormOutput } from "./line-form-schema";
import type { LineFormValues } from "./line-form-values";
import type { ItemOption, ProgramFormData } from "./program-form-data";

/**
 * Why a line's item cannot change here (ADR 0059, 0088): it is a bundle's part or a chosen
 * option, or it has part or option lines made from its item. Core refuses the change too.
 */
export type ItemLock = "part" | "option" | "parent" | null | undefined;

export type ProgramItemFieldProps = {
  form: UseFormReturn<LineFormValues, unknown, LineFormOutput>;
  data: ProgramFormData;
  itemLock?: ItemLock;
};

/** Grouped by item type (rooms, dishes, drinks), then by name within a type. */
const byTypeThenName = ({ items }: { items: ItemOption[] }) =>
  items.toSorted(
    (a, b) => (a.typeName ?? "").localeCompare(b.typeName ?? "") || a.name.localeCompare(b.name),
  );

/**
 * The line's item, searched by name with its list price, full width. A line that has an item
 * offers only items of that item's type (a meal for a buffet, a room for a room); a new line
 * offers every item, grouped by type. "No item" first.
 */
export function ProgramItemField({ form, data, itemLock }: ProgramItemFieldProps) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const items = useTranslations("item");
  const { money } = useNumberFormat();
  const startItemId = form.formState.defaultValues?.itemId;
  const options = useMemo(() => {
    const all = [...data.items, ...data.otherItems];
    const typeId = all.find((item) => item.id === startItemId)?.entityTypeId;
    return [
      { value: NONE, label: t("noItem") },
      ...byTypeThenName({
        items: all.filter((item) => !typeId || item.entityTypeId === typeId),
      }).map((item) => ({
        value: item.id,
        label: item.name,
        ...(item.typeName ? { group: item.typeName } : {}),
        ...(item.priceMinor === null ? {} : { trailing: priceText({ item, money, t: items }) }),
      })),
    ];
  }, [data.items, data.otherItems, startItemId, money, t, items]);
  return (
    <FormController
      control={form.control}
      name="itemId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("fields.item")}</FormLabel>
          <FormControl>
            <Combobox
              options={options}
              value={String(field.value ?? NONE)}
              onValueChange={field.onChange}
              disabled={data.itemsHidden || Boolean(itemLock)}
              placeholder={data.itemsHidden ? common("hidden") : common("select")}
              searchPlaceholder={t("itemSearch")}
              emptyText={t("noItemMatch")}
            />
          </FormControl>
          {itemLock ? <FormDescription>{t(`itemLock.${itemLock}`)}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
