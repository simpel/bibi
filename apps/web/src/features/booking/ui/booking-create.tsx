import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadBookingData } from "../load-booking-data";
import { BookingWizard } from "./booking-wizard";

export type BookingCreateProps = { locale: Locale };

/** `/new/booking`: the step-by-step create page. */
export async function BookingCreate({ locale }: BookingCreateProps) {
  const t = await getTranslations("booking");
  const data = await loadBookingData();
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.bookings}
      title={t("create")}
      description={t("createDescription")}
    >
      <BookingWizard data={data.value} />
    </FormPageShell>
  );
}
