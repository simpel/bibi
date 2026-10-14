import { getVenue } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { VenueItemsSection } from "@/features/item/ui/venue-items-section";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { VenueDetailHeader } from "./venue-detail-header";
import { VenueFacts } from "./venue-facts";

export type VenueDetailProps = {
  locale: Locale;
  id: string;
  itemCursor?: string | undefined;
};

/** Venue detail page body: facts, edit/archive, the venue's items. */
export async function VenueDetail({ locale, id, itemCursor }: VenueDetailProps) {
  const items = await getTranslations("item");
  const result = await runOperation({ operation: getVenue, input: { id } });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const venue = result.value;
  return (
    <div className="grid gap-8">
      <VenueDetailHeader venue={venue} />
      <VenueFacts venue={venue} />
      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">{items("plural")}</h2>
        <VenueItemsSection locale={locale} venueId={venue.id} cursor={itemCursor} />
      </section>
    </div>
  );
}
