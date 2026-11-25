import { getItemHours, getVenueHours } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import type { HoursKind } from "../item-tabs";
import { ItemHoursPanel } from "./item-hours-panel";

export type ItemHoursSectionProps = {
  locale: Locale;
  itemId: string;
  /** Working hours for a person, opening hours for anything else. */
  kind: HoursKind;
  /** The item's venue: its opening hours are what the item follows without own hours. */
  venue: { id: string; name: string } | null;
};

/**
 * Working or opening hours of a bookable item; without its own it follows its venue's opening hours (ADR 0064),
 * shown here too. The venue's hours need `venue:read`; without it only the item's own show.
 */
export async function ItemHoursSection({ locale, itemId, kind, venue }: ItemHoursSectionProps) {
  // Already resolved by the layout: a free read that decides whether the venue's hours load.
  const abilities = await getCallerAbilities();
  const seesVenue = venue !== null && can({ abilities, permission: "venue:read" });
  const [result, venueHours] = await Promise.all([
    runOperation({ operation: getItemHours, input: { itemId } }),
    venue && seesVenue
      ? runOperation({ operation: getVenueHours, input: { venueId: venue.id } })
      : null,
  ]);
  if (!result.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />;
  const hours = venueHours?.ok
    ? { days: venueHours.value.days, exceptions: venueHours.value.exceptions }
    : null;
  return (
    <section className="grid gap-3">
      <ItemHoursPanel
        itemId={itemId}
        kind={kind}
        own={{ days: result.value.days, exceptions: result.value.exceptions }}
        venue={venue ? { name: venue.name, hours } : null}
        canEdit={can({ abilities, permission: "item:write" })}
      />
    </section>
  );
}
