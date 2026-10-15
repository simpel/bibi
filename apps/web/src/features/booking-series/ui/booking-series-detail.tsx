import { getBookingSeries } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { ArrowLeftIcon, TriangleAlertIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadSeriesData } from "../load-series-data";
import { OccurrenceTable } from "./occurrence-table";
import { SeriesFacts } from "./series-facts";

export type BookingSeriesDetailProps = { locale: Locale; id: string };

/** Series detail page body: facts, a note on clashing occurrences, then every occurrence. */
export async function BookingSeriesDetail({ locale, id }: BookingSeriesDetailProps) {
  const common = await getTranslations("common");
  const t = await getTranslations("bookingSeries");
  const [series, data] = await Promise.all([
    runOperation({ operation: getBookingSeries, input: { id } }),
    loadSeriesData(),
  ]);
  if (!series.ok) {
    return <ErrorState errorKey={handleLoadError({ error: series.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const { clashes, occurrences, truncated } = series.value;
  return (
    <div className="grid gap-6">
      <Link
        href={ROUTES.bookingSeries}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader title={t("singular")} description={series.value.rule} />
      <SeriesFacts series={series.value} data={data.value} />
      {clashes.length > 0 ? (
        <p role="status" className="flex items-center gap-2 text-sm">
          <TriangleAlertIcon className="size-4 text-warning" />
          {t("clashNotice", { count: clashes.length })}
        </p>
      ) : null}
      {truncated ? <p className="text-sm text-muted-foreground">{t("truncated")}</p> : null}
      <OccurrenceTable occurrences={occurrences} data={data.value} />
    </div>
  );
}
