"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { WizardFooter } from "@/components/wizard/wizard-footer";
import { WizardProgress } from "@/components/wizard/wizard-progress";
import { ROUTES } from "@/lib/routes";
import { BaseSelectField } from "./base-select-field";
import { ItemTypeFields } from "./item-type-fields";
import { useEntityTypeWizard } from "./use-entity-type-wizard";

/** Create a type step by step: base and name, then (item types) capabilities; fields come next. */
export function EntityTypeWizard() {
  const t = useTranslations("entityType");
  const router = useRouter();
  const { form, steps, step, index, isLast, pending, next, submit, setIndex } =
    useEntityTypeWizard();
  const labels = steps.map((id) => ({ id, label: t(`wizard.steps.${id}`) }));
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-2xl gap-6">
        <WizardProgress steps={labels} index={index} label={t("wizard.progress")} />
        <p className="text-sm text-muted-foreground">{t(`wizard.descriptions.${step}`)}</p>
        {step === "base" ? (
          <>
            <BaseSelectField control={form.control} />
            <TextField form={form} name="name" label={t("fields.name")} required />
          </>
        ) : (
          <ItemTypeFields form={form} />
        )}
        <WizardFooter
          first={index === 0}
          last={isLast}
          pending={pending}
          canSave
          onBack={() => (index === 0 ? router.push(ROUTES.settingsTypes) : setIndex(index - 1))}
          onNext={next}
        />
      </form>
    </Form>
  );
}
