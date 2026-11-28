import { getBookingPage, listVocabularies } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { ErrorState } from "@/components/states/error-state";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { BookingPageForm } from "./booking-page-form";
import { BookingPagePublishedSwitch } from "./booking-page-published-switch";

export type BookingPageSectionProps = { locale: Locale };

/** The organization's public booking page: its address, look, texts and whether it is live. */
export async function BookingPageSection({ locale }: BookingPageSectionProps) {
  const [t, preview, abilities, page, lists] = await Promise.all([
    getTranslations("tableBooking.page"),
    getTranslations("tableBooking.preview"),
    getCallerAbilities(),
    runOperation({ operation: getBookingPage, input: {} }),
    runOperation({ operation: listVocabularies, input: { limit: 100 } }),
  ]);
  const listChoices = lists.ok
    ? lists.value.items
        .filter((list) => list.status === "ACTIVE")
        .map(({ id, name }) => ({ id, name }))
    : [];
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
        <>
          <Button asChild variant="outline">
            <Link href={ROUTES.adminTableBookingPreview}>{preview("navLabel")}</Link>
          </Button>
          <BookingPagePublishedSwitch
            published={page.value.published}
            canEdit={canEdit}
            hasSlug={page.value.slug !== null}
          />
        </>
      }
    >
      <BookingPageForm page={page.value} canEdit={canEdit} lists={listChoices} />
    </AdminSection>
  );
}
