import { listArchived } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { ErrorState } from "@/components/states/error-state";
import { toLifecycleKind } from "@/features/lifecycle/lifecycle-kinds";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ArchivedRecordsTable } from "./archived-records-table";
import type { ArchivedRow } from "./archived-row";

export type ArchivedRecordsSectionProps = { locale: Locale };

/**
 * `/admin/archive`: every archived record the caller may restore or delete (ADR 0118), with the
 * day the retention job deletes it. Dates are written here and passed down.
 */
export async function ArchivedRecordsSection({ locale }: ArchivedRecordsSectionProps) {
  const [t, format, result] = await Promise.all([
    getTranslations("archive"),
    getDateTimeFormat(),
    runOperation({ operation: listArchived, input: { limit: 500 } }),
  ]);
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <AdminSection section="archivedRecords">
        <ErrorState inline errorKey={errorKey} />
      </AdminSection>
    );
  }
  const { items, truncated, retentionDays } = result.value;
  const rows: ArchivedRow[] = items.flatMap((item) => {
    const kind = toLifecycleKind({ kind: item.kind });
    if (!kind) return [];
    return [
      {
        kind,
        id: item.id,
        name: item.name,
        archivedLabel: item.archivedAt ? format.date({ instant: item.archivedAt }) : "–",
        archivedMs: item.archivedAt?.getTime() ?? 0,
        deletesLabel: item.deletesAt ? format.date({ instant: item.deletesAt }) : "–",
        deletesMs: item.deletesAt?.getTime() ?? 0,
      },
    ];
  });
  return (
    <AdminSection
      section="archivedRecords"
      description={t("description", { days: retentionDays })}
      actions={
        <Link href={`${ROUTES.adminGeneral}#archive-retention`} className="text-sm underline">
          {t("retentionLink")}
        </Link>
      }
    >
      <ArchivedRecordsTable rows={rows} />
      {truncated ? (
        <p className="text-sm text-muted-foreground">{t("truncated", { count: rows.length })}</p>
      ) : null}
    </AdminSection>
  );
}
