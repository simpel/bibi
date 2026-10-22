import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadGridData } from "../load-grid-data";
import { PhaseGridTable } from "./phase-grid-table";

export type PhaseGridEditorProps = { locale: Locale };

/** The grid editor under the phases on `/settings/pipeline` (ADR 0044). */
export async function PhaseGridEditor({ locale }: PhaseGridEditorProps) {
  const t = await getTranslations("phaseGrid");
  const abilities = await getCallerAbilities();
  const data = await loadGridData();
  if (!data.ok) {
    return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  }
  if (data.value.phases.length === 0 || data.value.types.length === 0) return null;
  return (
    <section className="grid gap-3" aria-labelledby="phase-grid-title">
      <div className="grid gap-1">
        <h2 id="phase-grid-title" className="text-lg font-medium">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <PhaseGridTable {...data.value} canEdit={can({ abilities, permission: "pipeline:write" })} />
    </section>
  );
}
