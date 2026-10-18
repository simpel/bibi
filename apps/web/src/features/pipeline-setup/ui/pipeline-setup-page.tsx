import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadSetupData } from "../load-setup-data";
import { PipelineSetupWizard } from "./pipeline-setup-wizard";

export type PipelineSetupPageProps = { locale: Locale };

/** `/onboarding/pipeline`: the guided pipeline setup (ADR 0044). */
export async function PipelineSetupPage({ locale }: PipelineSetupPageProps) {
  const t = await getTranslations("pipelineSetup");
  const data = await loadSetupData();
  return (
    <FormPageShell
      backHref={ROUTES.settingsPipeline}
      title={t("title")}
      description={t("description")}
    >
      {data.ok ? (
        <PipelineSetupWizard options={data.value.options} defaults={data.value.defaults} />
      ) : (
        <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />
      )}
    </FormPageShell>
  );
}
