"use client";

import { Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { WizardFooter } from "@/components/wizard/wizard-footer";
import { WizardProgress } from "@/components/wizard/wizard-progress";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { BaseSelectField } from "./base-select-field";
import { BuyerKindField } from "./buyer-kind-field";
import type { GroupOption } from "./group-select-field";
import { ItemTypeFields } from "./item-type-fields";
import { TaskShapeField } from "./task-shape-field";
import { useEntityTypeWizard } from "./use-entity-type-wizard";

export type EntityTypeWizardProps = {
  groups: readonly GroupOption[];
  /** Opened from the item create page: back and save return there. */
  forItem: boolean;
};

/** Create a type step by step: base and name, then (item types) capabilities; fields come next. */
export function EntityTypeWizard({ groups, forItem }: EntityTypeWizardProps) {
  const t = useTranslations("entityType");
  const router = useRouter();
  const { form, steps, step, index, isLast, pending, next, submit, setIndex } = useEntityTypeWizard(
    { forItem },
  );
  const backHref = forItem ? ROUTES.itemNew : ROUTES.adminTypes;
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
            <TextField
              form={form}
              name="pluralName"
              label={t("fields.pluralName")}
              placeholder={t("fields.pluralNamePlaceholder")}
            />
            {form.watch("base") === "CUSTOMER" ? <BuyerKindField control={form.control} /> : null}
            {form.watch("base") === "TASK" ? <TaskShapeField control={form.control} /> : null}
          </>
        ) : (
          <ItemTypeFields form={form} groups={groups} />
        )}
        <WizardFooter
          first={index === 0}
          last={isLast}
          pending={pending}
          canSave
          onBack={() => (index === 0 ? router.push(backHref) : setIndex(index - 1))}
          onNext={next}
        />
      </form>
    </Form>
  );
}
