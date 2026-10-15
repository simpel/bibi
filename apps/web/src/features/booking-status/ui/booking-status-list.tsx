import { listBookingStatuses } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { BookingStatusTable } from "./booking-status-table";
import { CreateBookingStatusButton } from "./create-booking-status-button";
import { ImportBookingStatusTemplateButton } from "./import-booking-status-template-button";

export type BookingStatusListProps = { locale: Locale };

/** An organization has a handful of statuses; reordering needs all of them on one page. */
const PAGE_SIZE = 100;

/** Booking statuses page body: header with admin actions and the ordered table. */
export async function BookingStatusList({ locale }: BookingStatusListProps) {
  const t = await getTranslations("bookingStatus");
  const { bookingStatusAdmin } = await getCallerAbilities();
  const result = await runOperation({
    operation: listBookingStatuses,
    input: { limit: PAGE_SIZE },
  });
  const actions = bookingStatusAdmin ? (
    <>
      <ImportBookingStatusTemplateButton />
      <CreateBookingStatusButton />
    </>
  ) : undefined;
  const header = (
    <PageHeader title={t("plural")} description={t("listDescription")} actions={actions} />
  );
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  const { items } = result.value;
  return (
    <div className="grid gap-6">
      {header}
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={actions} />
      ) : (
        <BookingStatusTable statuses={items} canAdmin={bookingStatusAdmin} />
      )}
    </div>
  );
}
