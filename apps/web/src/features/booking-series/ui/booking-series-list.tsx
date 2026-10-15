import { type BookingSeriesDto, listBookingSeries } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadSeriesData } from "../load-series-data";
import { BookingSeriesTable } from "./booking-series-table";
import { CreateSeriesButton } from "./create-series-button";

export type BookingSeriesListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 20;

/** Series page body: header with create, the table (or an empty state) and pagination. */
export async function BookingSeriesList({ locale, cursor }: BookingSeriesListProps) {
  const t = await getTranslations("bookingSeries");
  const { bookingWrite } = await getCallerAbilities();
  const [data, result] = await Promise.all([
    loadSeriesData(),
    runOperation({
      operation: listBookingSeries,
      input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    }),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const canCreate = bookingWrite && data.value.types.length > 0;
  const create = canCreate ? <CreateSeriesButton data={data.value} /> : undefined;
  const page: { items: BookingSeriesDto[]; nextCursor: string | null } = result.value;
  return (
    <div className="grid gap-6">
      <PageHeader title={t("plural")} description={t("listDescription")} actions={create} />
      {page.items.length === 0 && !cursor ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <>
          <BookingSeriesTable series={page.items} data={data.value} />
          <CursorPagination
            pathname={ROUTES.bookingSeries}
            cursor={cursor}
            nextCursor={page.nextCursor}
          />
        </>
      )}
    </div>
  );
}
