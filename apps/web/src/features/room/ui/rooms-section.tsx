import { listRooms } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { venueRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateRoomButton } from "./create-room-button";
import { RoomTable } from "./room-table";

export type RoomsSectionProps = {
  locale: Locale;
  venueId: string;
  venueName: string;
  cursor?: string | undefined;
};

const PAGE_SIZE = 20;

/** Rooms of one venue with cursor pagination (`?roomCursor=`), create, edit and archive. */
export async function RoomsSection({ locale, venueId, venueName, cursor }: RoomsSectionProps) {
  const t = await getTranslations("room");
  const result = await runOperation({
    operation: listRooms,
    input: { venueId, limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
  });
  if (!result.ok) {
    return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  }
  const { items, nextCursor } = result.value;
  if (items.length === 0 && !cursor) {
    const action = <CreateRoomButton venueId={venueId} venueName={venueName} />;
    return <EmptyState title={t("empty")} description={t("emptyDescription")} action={action} />;
  }
  return (
    <div className="grid gap-4">
      <RoomTable rooms={items} venueName={venueName} />
      <CursorPagination
        pathname={venueRoute({ id: venueId })}
        cursor={cursor}
        nextCursor={nextCursor}
        param="roomCursor"
      />
    </div>
  );
}
