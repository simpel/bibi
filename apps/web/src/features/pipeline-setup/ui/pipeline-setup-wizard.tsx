"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useWizard } from "@/components/wizard/use-wizard";
import { WizardFooter } from "@/components/wizard/wizard-footer";
import { WizardProgress } from "@/components/wizard/wizard-progress";
import { ROUTES } from "@/lib/routes";
import type { SetupTypeOption } from "./setup-defaults";
import type { SetupFormValues } from "./setup-form-schema";
import { SetupStepContent } from "./setup-step-content";
import { fieldsOfStep, SETUP_STEPS } from "./setup-steps";
import { usePipelinePreview } from "./use-pipeline-preview";
import { useSetupForm } from "./use-setup-form";

export type PipelineSetupWizardProps = {
  options: SetupTypeOption[];
  defaults: SetupFormValues;
};

/**
 * The guided pipeline setup (ADR 0044): item types, states, phases, the grid, a preview of a
 * simulated ticket and activation. Nothing is saved before the last step.
 */
export function PipelineSetupWizard({ options, defaults }: PipelineSetupWizardProps) {
  const t = useTranslations("pipelineSetup");
  const router = useRouter();
  const { form, run, pending } = useSetupForm({ defaults });
  const preview = usePipelinePreview({ form });
  const wizard = useWizard({ form, steps: [...SETUP_STEPS], fieldsOf: fieldsOfStep, run });
  const { step, index } = wizard;
  const { refresh } = preview;
  useEffect(() => {
    if (step === "preview" || step === "activate") refresh();
  }, [step, refresh]);
  return (
    <Form {...form}>
      <form onSubmit={wizard.submit} noValidate className="grid min-w-0 grid-cols-1 gap-6">
        <WizardProgress
          steps={SETUP_STEPS.map((id) => ({ id, label: t(`steps.${id}`) }))}
          index={index}
          label={t("progress")}
        />
        <p className="text-sm text-muted-foreground">{t(`descriptions.${step}`)}</p>
        <SetupStepContent step={step} form={form} options={options} preview={preview} />
        <WizardFooter
          first={index === 0}
          last={wizard.isLast}
          pending={pending || preview.pending}
          canSave={preview.preview?.ready === true}
          onBack={() =>
            index === 0 ? router.push(ROUTES.settingsPipeline) : wizard.setIndex(index - 1)
          }
          onNext={wizard.next}
        />
      </form>
    </Form>
  );
}
