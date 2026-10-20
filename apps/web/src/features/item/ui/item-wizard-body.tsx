import type { EntityTypeDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import { CapabilitySections } from "./capability-sections";
import { ItemCoreFields } from "./item-core-fields";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";
import type { WizardStep } from "./item-wizard-steps";

export type ItemWizardBodyProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  step: WizardStep;
  type: EntityTypeDto | undefined;
  data: ItemFormData;
  typeOf: (input: { id: string }) => EntityTypeDto | undefined;
};

/** The fields of the current step. */
export function ItemWizardBody({ form, step, type, data, typeOf }: ItemWizardBodyProps) {
  const t = useTranslations("item.fields");
  if (step === "type") {
    return (
      <TypeSelectField
        control={form.control}
        types={data.types}
        label={t("type")}
        onTypeChange={(id) =>
          form.setValue("fields", rawFields({ type: typeOf({ id }), stored: {} }))
        }
      />
    );
  }
  if (!type) return null;
  if (step === "details") {
    return (
      <>
        <ItemCoreFields form={form} venues={data.venues} venuesHidden={data.venuesHidden} />
        <TypeFields control={form.control} type={type} data={data} />
      </>
    );
  }
  return <CapabilitySections form={form} type={type} data={data} />;
}
