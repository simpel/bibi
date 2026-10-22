import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { handleLoadError } from "@/server/load-error";
import { platformOperations } from "@/server/platform-operations";
import { runPlatformOperation } from "@/server/run-platform-operation";
import { AiFeatureTable } from "./ai-feature-table";
import type { AiFeatureRow } from "./model-options";

export type AiModelsViewProps = { locale: Locale };

/**
 * `/admin/ai-models`: one table row per AI feature with only its *possible* models (ADR 0015).
 * A catalog outage leaves the current choices visible and the pickers disabled.
 */
export async function AiModelsView({ locale }: AiModelsViewProps) {
  const t = await getTranslations("admin.aiModels");
  const ops = platformOperations();
  const features = await runPlatformOperation({ operation: ops.listAiFeatures, input: {} });
  const header = <PageHeader title={t("title")} description={t("description")} />;
  if (!features.ok) {
    const errorKey = handleLoadError({ error: features.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  const rows: AiFeatureRow[] = await Promise.all(
    features.value.items.map(async (setting) => {
      const input = { feature: setting.id };
      const models = await runPlatformOperation({ operation: ops.listAiModels, input });
      return { setting, models: models.ok ? models.value.items : null };
    }),
  );
  const failed = rows.some((row) => row.models === null);
  const empty = rows.some((row) => row.models?.length === 0);
  return (
    <div className="grid gap-6">
      {header}
      {failed || empty ? (
        <p role="alert" className="rounded-md border border-warning bg-warning/10 p-3 text-sm">
          {failed ? t("catalogFailed") : t("noPossibleModels")}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{t("possibleHint")}</p>
      )}
      <AiFeatureTable rows={rows} />
    </div>
  );
}
