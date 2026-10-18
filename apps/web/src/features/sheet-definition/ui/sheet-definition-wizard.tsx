"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { StepWizard } from "@/components/wizard/step-wizard";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { createSheetDefinitionAction } from "../actions";
import { sheetSteps } from "./sheet-definition-wizard-steps";
import type { SheetOptions } from "./sheet-options";
import { useSheetDefinitionForm } from "./use-sheet-definition-form";

export type SheetDefinitionWizardProps = { options: SheetOptions };

/** Create a sheet step by step: name, what it contains, then who receives it. */
export function SheetDefinitionWizard({ options }: SheetDefinitionWizardProps) {
  const t = useTranslations("sheetDefinition");
  const router = useRouter();
  const form = useSheetDefinitionForm({});
  const { run, pending } = useFormAction({
    form,
    action: ({ values }) => createSheetDefinitionAction({ input: values }),
    messages: { pending: t("saving"), success: t("created") },
    onSuccess: () => router.push(ROUTES.settingsSheets),
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
      cancelHref={ROUTES.settingsSheets}
      progressLabel={t("wizard.progress")}
      steps={sheetSteps({ form, options, nameLabel: t("fields.name"), text })}
    />
  );
}
