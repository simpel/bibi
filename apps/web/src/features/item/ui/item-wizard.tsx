"use client";

import { useRouter } from "@bibi/i18n/navigation";
import { Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { WizardFooter } from "@/components/wizard/wizard-footer";
import { WizardProgress } from "@/components/wizard/wizard-progress";
import { ROUTES } from "@/lib/routes";
import type { ItemFormData } from "./item-form-data";
import { ItemWizardBody } from "./item-wizard-body";
import { useItemWizard } from "./use-item-wizard";

export type ItemWizardProps = { data: ItemFormData; typeId?: string | undefined };

/** Create an item one step at a time: type, then its details, then price and other capabilities. */
export function ItemWizard({ data, typeId }: ItemWizardProps) {
  const t = useTranslations("item");
  const router = useRouter();
  const wizard = useItemWizard({ data, typeId, onDone: () => router.push(ROUTES.items) });
  const { form, type, step, steps, index, isLast, pending } = wizard;
  const first = index === 0;
  const labels = steps.map((id) => ({ id, label: t(`wizard.steps.${id}`) }));
  return (
    <Form {...form}>
      <form onSubmit={wizard.submit} noValidate className="grid max-w-2xl gap-6">
        <WizardProgress steps={labels} index={index} label={t("wizard.progress")} />
        <p className="text-sm text-muted-foreground">{t(`wizard.descriptions.${step}`)}</p>
        <ItemWizardBody form={form} step={step} type={type} data={data} typeOf={wizard.typeOf} />
        <WizardFooter
          first={first}
          last={isLast}
          pending={pending}
          canSave={Boolean(type)}
          onBack={() => (first ? router.push(ROUTES.items) : wizard.setIndex(index - 1))}
          onNext={wizard.next}
        />
      </form>
    </Form>
  );
}
