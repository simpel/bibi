"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { StepWizard } from "@/components/wizard/step-wizard";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { createResponsibilityAction } from "../actions";
import type { ResponsibilityOptions } from "./responsibility-options";
import { responsibilitySteps } from "./responsibility-wizard-steps";
import { useResponsibilityForm } from "./use-responsibility-form";

export type ResponsibilityWizardProps = { options: ResponsibilityOptions };

/** Create a responsibility step by step: name and covered types, then who it goes to. */
export function ResponsibilityWizard({ options }: ResponsibilityWizardProps) {
  const t = useTranslations("responsibility");
  const router = useRouter();
  const form = useResponsibilityForm({});
  const { run, pending } = useFormAction({
    form,
    action: ({ values }) => createResponsibilityAction({ input: values }),
    messages: { pending: t("saving"), success: t("created") },
    onSuccess: () => router.push(ROUTES.settingsResponsibilities),
  });
  const text = ({ id }: { id: string }) => ({
    id,
    label: t(`wizard.steps.${id as "scope"}`),
    description: t(`wizard.descriptions.${id as "scope"}`),
  });
  return (
    <StepWizard
      form={form}
      run={run}
      pending={pending}
      cancelHref={ROUTES.settingsResponsibilities}
      progressLabel={t("wizard.progress")}
      steps={responsibilitySteps({ form, options, nameLabel: t("fields.name"), text })}
    />
  );
}
