import { type ItemDto, listDiningRooms, listItems } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { listAll } from "@/server/list-all";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import type { DiningRoomRow } from "../lib/room-row";
import { CreateDiningRoomButton } from "./create-dining-room-button";
import { DiningRoomTable } from "./dining-room-table";

export type DiningRoomSectionProps = { locale: Locale };

/** Rooms of types with layouts: the ones that can be set up for table booking. */
function roomItems({ items, setupTypeIds }: { items: ItemDto[]; setupTypeIds: Set<string> }) {
  return items.filter((item) => setupTypeIds.has(item.entityTypeId));
}

/** Dining rooms section: the rooms set up for table booking, and Create to set one up. */
export async function DiningRoomSection({ locale }: DiningRoomSectionProps) {
  const [t, abilities, rooms, items, types, format] = await Promise.all([
    getTranslations("tableBooking.rooms"),
    getCallerAbilities(),
    runOperation({ operation: listDiningRooms, input: {} }),
    listAll({ operation: listItems, input: {} }),
    loadEntityTypesOf({ base: "ITEM" }),
    getDateTimeFormat(),
  ]);
  const failed = !rooms.ok ? rooms : !items.ok ? items : !types.ok ? types : null;
  if (failed) {
    return (
      <AdminSection section="diningRooms">
        <ErrorState errorKey={handleLoadError({ error: failed.error, locale })} inline />
      </AdminSection>
    );
  }
  if (!rooms.ok || !items.ok || !types.ok) return null;
  const setupTypeIds = new Set(
    types.value.items.filter((type) => type.capabilities.includes("SETUPS")).map((type) => type.id),
  );
  const rooms_ = roomItems({ items: items.value, setupTypeIds });
  const setUp = new Set(rooms.value.items.map((room) => room.itemId));
  const names = new Map(rooms_.map((item) => [item.id, item]));
  const canCreate = can({ abilities, permission: "diningSetup:write" });
  const candidates = rooms_.filter((item) => !setUp.has(item.id));
  const create = canCreate ? <CreateDiningRoomButton candidates={candidates} /> : undefined;
  if (rooms.value.items.length === 0 && !create) return null;
  const rows: DiningRoomRow[] = rooms.value.items.map((room) => {
    const item = names.get(room.itemId);
    return {
      itemId: room.itemId,
      name: item?.name ?? room.slug,
      slug: room.slug,
      openUntil: room.openUntil
        ? format.date({ instant: room.openUntil, timeZone: item?.timeZone, year: true })
        : "",
      openUntilSort: room.openUntil?.getTime() ?? Number.POSITIVE_INFINITY,
    };
  });
  return (
    <AdminSection section="diningRooms" description={t("description")} actions={create}>
      {rows.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <DiningRoomTable rows={rows} />
      )}
    </AdminSection>
  );
}
