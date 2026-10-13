import { getVenue } from "@okazi/core";
import { Badge } from "@okazi/ui";
import { Link } from "@okazi/i18n/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateRoomButton } from "@/features/room/ui/create-room-button";
import { RoomsSection } from "@/features/room/ui/rooms-section";
import { VenueFacts } from "./venue-facts";
import { VenueRowActions } from "./venue-row-actions";

export type VenueDetailProps = {
  locale: string;
  id: string;
  roomCursor?: string | undefined;
};

/** Venue detail page body: facts, edit/archive, rooms table. */
export async function VenueDetail({ locale, id, roomCursor }: VenueDetailProps) {
  const t = await getTranslations("venue");
  const common = await getTranslations("common");
  const result = await runOperation({ operation: getVenue, input: { id } });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const venue = result.value;
  return (
    <div className="grid gap-8">
      <Link href={ROUTES.venues} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader
        title={venue.name}
        description={venue.description ?? undefined}
        actions={<VenueRowActions venue={venue} redirectToList />}
      />
      <Badge variant="success" className="-mt-6">{common("active")}</Badge>
      <VenueFacts venue={venue} />
      <section className="grid gap-4" aria-labelledby="rooms-heading">
        <div className="flex items-center justify-between">
          <h2 id="rooms-heading" className="text-xl font-semibold">{t("roomsHeading")}</h2>
          <CreateRoomButton venueId={venue.id} venueName={venue.name} />
        </div>
        <RoomsSection locale={locale} venueId={venue.id} venueName={venue.name} cursor={roomCursor} />
      </section>
    </div>
  );
}
