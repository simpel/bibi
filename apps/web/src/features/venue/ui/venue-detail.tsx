import { getVenue } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { CreateRoomButton } from "@/features/room/ui/create-room-button";
import { RoomsSection } from "@/features/room/ui/rooms-section";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { VenueDetailHeader } from "./venue-detail-header";
import { VenueFacts } from "./venue-facts";

export type VenueDetailProps = {
  locale: Locale;
  id: string;
  roomCursor?: string | undefined;
};

/** Venue detail page body: facts, edit/archive, rooms table. */
export async function VenueDetail({ locale, id, roomCursor }: VenueDetailProps) {
  const t = await getTranslations("venue");
  const result = await runOperation({ operation: getVenue, input: { id } });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const venue = result.value;
  return (
    <div className="grid gap-8">
      <VenueDetailHeader venue={venue} />
      <VenueFacts venue={venue} />
      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("roomsHeading")}</h2>
          <CreateRoomButton venueId={venue.id} venueName={venue.name} />
        </div>
        <RoomsSection
          locale={locale}
          venueId={venue.id}
          venueName={venue.name}
          cursor={roomCursor}
        />
      </section>
    </div>
  );
}
