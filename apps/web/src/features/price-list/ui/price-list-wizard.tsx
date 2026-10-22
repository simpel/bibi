"use client";

import { useRouter } from "@bibi/i18n/navigation";
import { useTranslations } from "next-intl";
import { StepWizard } from "@/components/wizard/step-wizard";
import { ROUTES } from "@/lib/routes";
import type { PriceListFormData } from "./load-price-list-form-data";
import { PriceListIdentityFields, PriceListTermsFields } from "./price-list-step-fields";
import { usePriceListForm } from "./use-price-list-form";

export type PriceListWizardProps = { data: PriceListFormData };

/** Create a price list step by step: name and customer, then validity and discount. */
export function PriceListWizard({ data }: PriceListWizardProps) {
  const t = useTranslations("priceList");
  const router = useRouter();
  const { form, run, pending } = usePriceListForm({
    onDone: () => router.push(ROUTES.settingsPriceLists),
  });
  const text = ({ id }: { id: "identity" | "terms" }) => ({
    id,
    label: t(`wizard.steps.${id}`),
    description: t(`wizard.descriptions.${id}`),
  });
  return (
    <StepWizard
      form={form}
      run={run}
      pending={pending}
      cancelHref={ROUTES.settingsPriceLists}
      progressLabel={t("wizard.progress")}
      steps={[
        {
          ...text({ id: "identity" }),
          fields: ["name", "customerId"],
          content: <PriceListIdentityFields form={form} data={data} />,
        },
        {
          ...text({ id: "terms" }),
          fields: ["validFrom", "validTo", "discountPercent"],
          content: <PriceListTermsFields form={form} />,
        },
      ]}
    />
  );
}
