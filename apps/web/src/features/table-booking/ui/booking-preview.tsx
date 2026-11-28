import { getBookingPage } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button, PageBand, PageBands } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { loadBookingPage } from "@/features/guest-booking/server/load-guest-booking";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { BookingPreviewFrame } from "./booking-preview-frame";

export type BookingPreviewProps = { locale: Locale };

/**
 * `/admin/table-booking/preview`: the guest's own booking pages in a frame, on a phone or a
 * computer, so the organization clicks through its logo, colours, texts and every step.
 */
export async function BookingPreview({ locale }: BookingPreviewProps) {
  const [t, page] = await Promise.all([
    getTranslations("tableBooking.preview"),
    runOperation({ operation: getBookingPage, input: {} }),
  ]);
  if (!page.ok) return <ErrorState errorKey={handleLoadError({ error: page.error, locale })} />;
  const { slug, published } = page.value;
  const live = slug !== null && published ? await loadBookingPage({ slug }) : null;
  return (
    <PageBands>
      <CrumbName href={ROUTES.adminTableBookingPreview} name={t("navLabel")} />
      <PageBand containerClassName="gap-2">
        <PageHeader title={t("title")} description={t("description")} />
      </PageBand>
      <PageBand containerClassName="gap-4">
        {live ? (
          <BookingPreviewFrame
            slug={live.slug}
            rooms={live.rooms.map((room) => ({ slug: room.slug, name: room.name }))}
          />
        ) : (
          <EmptyState
            title={t("notLive")}
            description={t("notLiveDescription")}
            action={
              <Button asChild>
                <Link href={`${ROUTES.adminTableBooking}#bookingPage`}>{t("goToPage")}</Link>
              </Button>
            }
          />
        )}
      </PageBand>
    </PageBands>
  );
}
