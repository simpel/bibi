import { getVenueHours } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { VenueHoursEditor } from "./venue-hours-editor";

export type VenueHoursSectionProps = { locale: Locale; venueId: string };

/** Opening hours of a venue: the weekly pattern and dated exceptions (ADR 0064 rule 10). */
export async function VenueHoursSection({ locale, venueId }: VenueHoursSectionProps) {
  const t = await getTranslations("venue.hours");
  const result = await runOperation({ operation: getVenueHours, input: { venueId } });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const abilities = await getCallerAbilities();
  return (
    <section className="grid gap-3">
      <div className="grid gap-1">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <VenueHoursEditor
        venueId={venueId}
        initial={{ days: result.value.days, exceptions: result.value.exceptions }}
        canEdit={can({ abilities, permission: "venue:write" })}
      />
    </section>
  );
}
