import { type BookingDto, listBookings } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadBookingData } from "../load-booking-data";
import { BookingTable } from "./booking-table";
import { CreateBookingButton } from "./create-booking-button";

export type BookingListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 20;

const GoToTypes = ({ label }: { label: string }) => (
  <Button asChild variant="outline">
    <Link href={ROUTES.settingsTypes}>{label}</Link>
  </Button>
);

/** Bookings page body: header with create, the table (or an empty state) and pagination. */
export async function BookingList({ locale, cursor }: BookingListProps) {
  const t = await getTranslations("booking");
  const { bookingWrite } = await getCallerAbilities();
  const [data, result] = await Promise.all([
    loadBookingData(),
    runOperation({
      operation: listBookings,
      input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    }),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const noTypes = data.value.types.length === 0;
  const create = bookingWrite && !noTypes ? <CreateBookingButton data={data.value} /> : undefined;
  const page: { items: BookingDto[]; nextCursor: string | null } = result.value;
  return (
    <div className="grid gap-6">
      <PageHeader title={t("plural")} description={t("listDescription")} actions={create} />
      {page.items.length === 0 && !cursor ? (
        <EmptyState
          title={t("empty")}
          description={noTypes ? t("noTypes") : t("emptyDescription")}
          action={noTypes ? <GoToTypes label={t("goToTypes")} /> : create}
        />
      ) : (
        <>
          <BookingTable bookings={page.items} data={data.value} />
          <CursorPagination
            pathname={ROUTES.bookings}
            cursor={cursor}
            nextCursor={page.nextCursor}
          />
        </>
      )}
    </div>
  );
}
