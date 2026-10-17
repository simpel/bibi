import { getBookingSeries } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadSeriesData } from "../load-series-data";
import { CancelSeriesButton } from "./cancel-series-button";
import { OccurrenceTable } from "./occurrence-table";
import { SeriesFacts } from "./series-facts";
import { SeriesNotices } from "./series-notices";

export type BookingSeriesDetailProps = { locale: Locale; id: string };

/** Series detail page body: facts, notices (clashes, cancellation), then every occurrence. */
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
  return (
    <div className="grid gap-6">
      <Link
        href={ROUTES.bookingSeries}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader
        title={t("singular")}
        description={series.value.rule}
        actions={series.value.cancelledAt ? null : <CancelSeriesButton id={id} />}
      />
      <SeriesFacts series={series.value} data={data.value} />
      <SeriesNotices series={series.value} />
      <OccurrenceTable
        series={series.value}
        statuses={data.value.statuses}
        rooms={data.value.rooms}
      />
    </div>
  );
}
