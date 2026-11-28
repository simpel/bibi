import { viewReservationDay } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { dayOf } from "../../table-booking/lib/edge-time";
import { tablesOf } from "../../table-booking/lib/layout-tables";
import { dayTimes, floorPlanData, toFloorSitting } from "../lib/floor-data";
import type { FloorBlock } from "../lib/floor-model";
import { needsLabel, type ReservationRow } from "../lib/reservation-row";
import type { TableChoice } from "../lib/table-choice";
import { AdminMenu } from "./admin-menu";
import { CreateReservationButton } from "./create-reservation-button";
import { DayToolbar } from "./day-toolbar";
import { DayWorkspace } from "./day-workspace";
import { FullscreenButton, FullscreenFrame } from "./fullscreen-frame";

export type DayScreenProps = {
  locale: Locale;
  date: string;
  /** The room's item id from `?room=`; none = the first dining room. */
  room: string | undefined;
  /** Open the create sheet at once (from the create menu, `?create=1`). */
  createOpen?: boolean;
};

/**
 * The staff day view (ADR 0119), a full-width workspace: the room, the day and its totals on one
 * row, then the floor and the day's reservations side by side. The room is a filter (`?room=`);
 * the day is in the path.
 */
export async function DayScreen({ locale, date, room, createOpen = false }: DayScreenProps) {
  const [t, abilities, view, format] = await Promise.all([
    getTranslations("reservation"),
    getCallerAbilities(),
    runOperation({ operation: viewReservationDay, input: { roomItemId: room, date } }),
    getDateTimeFormat(),
  ]);
  if (!view.ok) return <ErrorState errorKey={handleLoadError({ error: view.error, locale })} />;
  const { room: span, needOptions } = view.value;
  const selected = view.value.rooms.find((one) => one.itemId === span?.itemId);
  if (!span || !selected)
    return <EmptyState title={t("noRooms")} description={t("noRoomsDescription")} />;
  const { itemId: roomItemId, timeZone } = span;
  const rooms = view.value.rooms.map((one) => ({ ...one, name: one.name ?? one.slug }));
  const roomName = selected.name ?? selected.slug;
  const canWrite = can({ abilities, permission: "reservation:write" });
  const canSetUp = can({ abilities, permission: "diningSetup:read" });
  const names = new Map(needOptions.map((need) => [need.id, need.name]));
  const rows: ReservationRow[] = view.value.reservations.items.map((item) => ({
    id: item.id,
    time: format.time({ instant: item.startsAt, timeZone }),
    startsAtMs: item.startsAt.getTime(),
    endsAtMs: item.endsAt.getTime(),
    partySize: item.partySize,
    name: item.bookerName ?? t("anonymous"),
    tables: item.tables.map((table) => table.label ?? "–").join(", "),
    tableIds: item.tables.map((table) => table.elementId),
    needs: needsLabel({ needs: item.requirements, names }),
    source: item.source,
    sourceLabel: t(`source.${item.source}`),
    state: item.state,
    stateLabel: t(`state.${item.state}`),
  }));
  const layoutTables = view.value.layouts.map((layout) => ({
    layoutId: layout.id,
    tables: tablesOf({ layout }).map(
      (table): TableChoice => ({ id: table.id, label: table.label, seats: table.seats }),
    ),
  }));
  const tablesByService = Object.fromEntries(
    view.value.sittings.map((sitting) => [
      sitting.id,
      layoutTables.find((one) => one.layoutId === sitting.layoutId)?.tables ?? [],
    ]),
  );
  const allTables = [
    ...new Map(
      layoutTables.flatMap((one) => one.tables).map((table) => [table.id, table]),
    ).values(),
  ];
  const labelOf = new Map(allTables.map((table) => [table.id, table.label]));
  const blocks: FloorBlock[] = view.value.blocks
    .filter((block) => labelOf.has(block.elementId))
    .map((block) => ({
      id: block.id,
      tableId: block.elementId,
      label: labelOf.get(block.elementId) ?? "–",
      kind: block.kind,
      startsAtMs: block.startsAt.getTime(),
      endsAtMs: block.endsAt.getTime(),
      period: `${format.date({ instant: block.startsAt, timeZone, weekday: "short" })} ${format.timeRange({ start: block.startsAt, end: block.endsAt, timeZone })}`,
      note: block.note,
    }));
  const today = dayOf({ instant: new Date(), timeZone });
  const { totals } = view.value.reservations;
  const needsSummary = needsLabel({ needs: totals.needs, names });
  const actions = (
    <>
      {canWrite ? (
        <CreateReservationButton
          roomItemId={roomItemId}
          date={date}
          tablesByService={tablesByService}
          needOptions={needOptions}
          defaultOpen={createOpen}
        />
      ) : null}
      {canSetUp ? <AdminMenu roomItemId={roomItemId} /> : null}
      <FullscreenButton />
    </>
  );
  const times = dayTimes({
    sittings: view.value.sittings.map((one) => toFloorSitting({ sitting: one })),
    date,
    timeZone,
  });
  const firstBooked = rows.find((row) => row.state !== "NO_SHOW")?.startsAtMs ?? 0;
  const initialMs = (times.find((time) => time.ms >= firstBooked) ?? times[0])?.ms ?? 0;
  const plans = Object.fromEntries(
    [...new Set(times.map((time) => time.layoutId))].flatMap((layoutId) => {
      const layout = view.value.layouts.find((one) => one.id === layoutId);
      if (!layout) return [];
      const data = floorPlanData({ layout, tableName: (label) => t("floor.table", { label }) });
      return [[layoutId, { data, title: t("floor.title", { name: layout.name ?? roomName }) }]];
    }),
  );
  return (
    <FullscreenFrame className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4 lg:overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <DayToolbar rooms={rooms} roomItemId={roomItemId} date={date} today={today} />
        <p className="flex flex-wrap gap-x-3 text-sm">
          <span className="font-medium">
            {t("totals.reservations", { count: totals.reservations })}
          </span>
          <span className="font-medium">{t("totals.covers", { count: totals.covers })}</span>
          {needsSummary ? <span className="text-muted-foreground">{needsSummary}</span> : null}
        </p>
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
      <DayWorkspace
        key={`${roomItemId}-${date}`}
        roomItemId={roomItemId}
        date={date}
        plans={plans}
        times={times}
        initialMs={initialMs}
        rows={rows}
        blocks={blocks}
        canWrite={canWrite}
        tablesByService={tablesByService}
        allTables={allTables}
        needOptions={needOptions}
      />
    </FullscreenFrame>
  );
}
