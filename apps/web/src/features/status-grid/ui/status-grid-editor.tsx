import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadGridData } from "../load-grid-data";
import { StatusGridTable } from "./status-grid-table";

export type StatusGridEditorProps = { locale: Locale };

/** The `status-grid` section under the statuses on `/admin/pipeline` (ADR 0044). */
export async function StatusGridEditor({ locale }: StatusGridEditorProps) {
  const [t, abilities, data] = await Promise.all([
    getTranslations("statusGrid"),
    getCallerAbilities(),
    loadGridData(),
  ]);
  if (data.ok && (data.value.statuses.length === 0 || data.value.types.length === 0)) return null;
  return (
    <AdminSection id="status-grid" title={t("title")} description={t("description")}>
      {data.ok ? (
        <StatusGridTable
          {...data.value}
          canEdit={can({ abilities, permission: "pipeline:write" })}
        />
      ) : (
        <ErrorState errorKey={handleLoadError({ error: data.error, locale })} inline />
      )}
    </AdminSection>
  );
}
