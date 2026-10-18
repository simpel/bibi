import { getVenue } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { venueRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { VenueUpdateForm } from "./venue-update-form";

export type VenueUpdateProps = { locale: Locale; id: string };

/** `/venues/[id]/update`: edit the venue on a page of its own. */
export async function VenueUpdate({ locale, id }: VenueUpdateProps) {
  const t = await getTranslations("venue");
  const venue = await runOperation({ operation: getVenue, input: { id } });
  if (!venue.ok) return <ErrorState errorKey={handleLoadError({ error: venue.error, locale })} />;
  return (
    <FormPageShell
      backHref={venueRoute({ id })}
      title={t("edit")}
      description={t("editDescription")}
    >
      <VenueUpdateForm venue={venue.value} />
    </FormPageShell>
  );
}
