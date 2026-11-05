import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadVenue } from "@/features/venue/load-venue";
import { venueRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { VenueUpdateForm } from "./venue-update-form";

export type VenueUpdateProps = { locale: Locale; id: string };

/** `/venues/[id]/update`: edit the venue on a page of its own. */
export async function VenueUpdate({ locale, id }: VenueUpdateProps) {
  const t = await getTranslations("venue");
  const venue = await loadVenue({ id });
  if (!venue.ok) return <ErrorState errorKey={handleLoadError({ error: venue.error, locale })} />;
  return (
    <>
      <CrumbName href={venueRoute({ id })} name={venue.value.name} />
      <FormPageShell
        backHref={venueRoute({ id })}
        title={t("edit")}
        description={t("editDescription")}
      >
        <VenueUpdateForm venue={venue.value} />
      </FormPageShell>
    </>
  );
}
