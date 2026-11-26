import { getBookingPage } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { BookingPageForm } from "./booking-page-form";
import { BookingPagePublishedSwitch } from "./booking-page-published-switch";

export type BookingPageSectionProps = { locale: Locale };

/** The organization's public booking page: its address, look, texts and whether it is live. */
export async function BookingPageSection({ locale }: BookingPageSectionProps) {
  const [t, abilities, page] = await Promise.all([
    getTranslations("tableBooking.page"),
    getCallerAbilities(),
    runOperation({ operation: getBookingPage, input: {} }),
  ]);
  const canEdit = can({ abilities, permission: "diningSetup:write" });
  if (!page.ok) {
    return (
      <AdminSection section="bookingPage">
        <ErrorState errorKey={handleLoadError({ error: page.error, locale })} inline />
      </AdminSection>
    );
  }
  return (
    <AdminSection
      section="bookingPage"
      description={t("description")}
      actions={
        <BookingPagePublishedSwitch
          published={page.value.published}
          canEdit={canEdit}
          hasSlug={page.value.slug !== null}
        />
      }
    >
      <BookingPageForm page={page.value} canEdit={canEdit} />
    </AdminSection>
  );
}
