import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { WithHistory } from "@/features/audit-log/ui/with-history";
import { VenueItemsSection } from "@/features/item/ui/venue-items-section";
import { loadVenue } from "@/features/venue/load-venue";
import { venueRoute } from "@/lib/routes";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { VenueDetailHeader } from "./venue-detail-header";
import { VenueFacts } from "./venue-facts";
import { VenueHoursSection } from "./venue-hours-section";

export type VenueDetailProps = {
  locale: Locale;
  id: string;
  itemCursor?: string | undefined;
};

/** Venue detail page body: facts, edit/archive, the venue's items and its change history. */
export async function VenueDetail({ locale, id, itemCursor }: VenueDetailProps) {
  const [items, result, abilities] = await Promise.all([
    getTranslations("item"),
    loadVenue({ id }),
    getCallerAbilities(),
  ]);
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const venue = result.value;
  return (
    <div className="grid gap-8">
      <CrumbName href={venueRoute({ id })} name={venue.name} />
      <VenueDetailHeader venue={venue} access={rowAccess({ abilities, feature: "venue" })} />
      <WithHistory locale={locale} entityType="venue" entityId={venue.id}>
        <div className="grid gap-8">
          <VenueFacts venue={venue} />
          <VenueHoursSection locale={locale} venueId={venue.id} />
          {can({ abilities, permission: "item:read" }) ? (
            <section className="grid gap-4">
              <h2 className="text-xl">{items("plural")}</h2>
              <VenueItemsSection locale={locale} venueId={venue.id} cursor={itemCursor} />
            </section>
          ) : null}
        </div>
      </WithHistory>
    </div>
  );
}
