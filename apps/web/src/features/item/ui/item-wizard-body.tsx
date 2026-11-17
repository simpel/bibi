import type { EntityTypeDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
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
  /** The caller may create item types: the type step links to creating one. */
  canCreateType: boolean;
};

/** Leads to creating an item type; saving it comes back here with the new type picked. */
function CreateTypeLink() {
  const t = useTranslations("item.wizard");
  return (
    <Button asChild variant="outline" className="justify-self-start">
      <Link href={ROUTES.typeNewForItem}>
        <PlusIcon />
        {t("createType")}
      </Link>
    </Button>
  );
}

/** The fields of the current step. */
export function ItemWizardBody({
  form,
  step,
  type,
  data,
  typeOf,
  canCreateType,
}: ItemWizardBodyProps) {
  const t = useTranslations("item.fields");
  if (step === "type") {
    return (
      <>
        <TypeSelectField
          control={form.control}
          types={data.types}
          label={t("type")}
          onTypeChange={(id) =>
            form.setValue("fields", rawFields({ type: typeOf({ id }), stored: {} }))
          }
        />
        {canCreateType ? <CreateTypeLink /> : null}
      </>
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
