import { useTranslations } from "next-intl";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { PreviewPanel } from "./preview-panel";
import type { usePipelinePreview } from "./use-pipeline-preview";

export type PreviewStepProps = { preview: ReturnType<typeof usePipelinePreview> };

/** Step 5: the draft as a simulated ticket, before anything is saved. */
export function PreviewStep({ preview }: PreviewStepProps) {
  const t = useTranslations("pipelineSetup.preview");
  if (preview.errorKey) return <InlineLoadError errorKey={preview.errorKey} />;
  if (preview.invalid) return <p className="text-sm text-destructive">{t("invalid")}</p>;
  if (!preview.preview) return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  return <PreviewPanel preview={preview.preview} tableId="pipeline-setup.preview" />;
}
