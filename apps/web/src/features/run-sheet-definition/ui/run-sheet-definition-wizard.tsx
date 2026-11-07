"use client";

import { useTranslations } from "next-intl";
import { StepWizard } from "@/components/wizard/step-wizard";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { createRunSheetDefinitionAction } from "../actions";
import { runSheetSteps } from "./run-sheet-definition-wizard-steps";
import type { RunSheetOptions } from "./run-sheet-options";
import { useRunSheetDefinitionForm } from "./use-run-sheet-definition-form";

export type RunSheetDefinitionWizardProps = { options: RunSheetOptions };

/** Create a run sheet step by step: name, what it contains, then who receives it. */
export function RunSheetDefinitionWizard({ options }: RunSheetDefinitionWizardProps) {
  const t = useTranslations("runSheetDefinition");
  const router = useRouter();
  const form = useRunSheetDefinitionForm({});
  const { run, pending } = useFormAction({
    form,
    action: ({ values }) => createRunSheetDefinitionAction({ input: values }),
    messages: { pending: t("saving"), success: t("created") },
    onSuccess: () => router.push(ROUTES.adminRunSheets),
  });
  const text = ({ id }: { id: string }) => ({
    id,
    label: t(`wizard.steps.${id as "name"}`),
    description: t(`wizard.descriptions.${id as "name"}`),
  });
  return (
    <StepWizard
      form={form}
      run={run}
      pending={pending}
      cancelHref={ROUTES.adminRunSheets}
      progressLabel={t("wizard.progress")}
      steps={runSheetSteps({ form, options, nameLabel: t("fields.name"), text })}
    />
  );
}
