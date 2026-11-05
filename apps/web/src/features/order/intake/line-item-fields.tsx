import { useTranslations } from "next-intl";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { OptionGroupField } from "../../line/ui/option-group-field";
import { SplitGroupField } from "../../line/ui/split-group-field";
import { type CatalogItem, hasCapability } from "./catalog";
import type { LineDialogFormApi } from "./use-line-dialog-form";

export type LineItemFieldsProps = {
  form: LineDialogFormApi;
  item: CatalogItem | null;
  /** The line's quantity a split group should add up to. */
  quantity: number;
};

function SetupField({ form, item }: Omit<LineItemFieldsProps, "quantity">) {
  const t = useTranslations("orderIntake.line");
  if (!item || !hasCapability({ item, capability: "SETUPS" }) || item.setups.length === 0) {
    return null;
  }
  const options = item.setups.map(({ id, name, capacity }) => ({
    id,
    name: t("setupOption", { name, capacity }),
  }));
  return (
    <OptionSelectField
      control={form.control}
      name="setupId"
      label={t("setup")}
      options={options}
      noneLabel={t("noSetup")}
    />
  );
}

function PriceFields({ form, item }: Omit<LineItemFieldsProps, "quantity">) {
  const t = useTranslations("orderIntake.line");
  const { money } = useNumberFormat();
  if (item && !hasCapability({ item, capability: "PRICED" })) return null;
  const list = item?.priceMinor ?? null;
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      <TextField
        form={form}
        name="unitPrice"
        label={t("unitPrice")}
        type="number"
        step="0.01"
        placeholder={list === null ? undefined : money({ minor: list })}
      />
      <TextField
        form={form}
        name="discountPercent"
        label={t("discount")}
        type="number"
        step="0.01"
      />
    </div>
  );
}

/** Fields by the item's capabilities (ADR 0059): setup, choices per group and price. */
export function LineItemFields({ form, item, quantity }: LineItemFieldsProps) {
  const groups = item && hasCapability({ item, capability: "CUSTOMISATIONS" }) ? item.groups : [];
  return (
    <>
      <SetupField form={form} item={item} />
      {groups.map((group, index) =>
        group.split ? (
          <SplitGroupField key={group.name} {...{ form, index, group, quantity }} />
        ) : (
          <OptionGroupField key={group.name} form={form} index={index} group={group} />
        ),
      )}
      <PriceFields form={form} item={item} />
    </>
  );
}
