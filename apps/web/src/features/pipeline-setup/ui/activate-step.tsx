import { useTranslations } from "next-intl";
import { PreviewStep } from "./preview-step";
import type { SetupForm } from "./setup-form";
import type { usePipelinePreview } from "./use-pipeline-preview";

export type ActivateStepProps = {
  form: SetupForm;
  preview: ReturnType<typeof usePipelinePreview>;
};

/** Step 6: what saving does, and the preview's verdict; Save is enabled only when it is ready. */
export function ActivateStep({ form, preview }: ActivateStepProps) {
  const t = useTranslations("pipelineSetup.activate");
  const phases = form.watch("phases").length;
  const types = form.watch("itemTypes").length;
  return (
    <div className="grid gap-4">
      <p className="text-sm">{t("summary", { phases, types })}</p>
      <p className="text-sm text-muted-foreground">{t("replaces")}</p>
      {preview.preview?.ready ? null : <PreviewStep preview={preview} />}
    </div>
  );
}
