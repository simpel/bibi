import { ActivateStep } from "./activate-step";
import { GridStep } from "./grid-step";
import { PhasesStep } from "./phases-step";
import { PreviewStep } from "./preview-step";
import type { SetupTypeOption } from "./setup-defaults";
import type { SetupForm } from "./setup-form";
import type { SetupStep } from "./setup-steps";
import { StatesStep } from "./states-step";
import { TypesStep } from "./types-step";
import type { usePipelinePreview } from "./use-pipeline-preview";

export type SetupStepContentProps = {
  step: SetupStep;
  form: SetupForm;
  options: SetupTypeOption[];
  preview: ReturnType<typeof usePipelinePreview>;
};

/** The fields or view of the current step. */
export function SetupStepContent({ step, form, options, preview }: SetupStepContentProps) {
  switch (step) {
    case "types":
      return <TypesStep form={form} options={options} />;
    case "states":
      return <StatesStep form={form} />;
    case "phases":
      return <PhasesStep form={form} />;
    case "grid":
      return <GridStep form={form} />;
    case "preview":
      return <PreviewStep preview={preview} />;
    case "activate":
      return <ActivateStep form={form} preview={preview} />;
  }
}
