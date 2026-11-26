import type { Locale } from "@bibi/i18n";
import { SimplePage, StatusBadge } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { EditableSection } from "@/components/inline-edit/editable-section";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { dayOf } from "../../table-booking/lib/edge-time";
import { tablesOf } from "../../table-booking/lib/layout-tables";
import { NEXT_ACTIONS, needsLabel } from "../lib/reservation-row";
import { reservationRoute } from "../lib/routes";
import { bookerDefaults, needsDefaults, whenDefaults } from "../lib/update-forms";
import { loadReservation } from "../load-reservation";
import { loadDiningRoomOptions, loadNeedOptions, loadRoomTables } from "../load-reservation-data";
import { ReservationDangerArea } from "./reservation-danger-area";
import { BookerForm, NeedsForm, WhenForm } from "./reservation-edit-forms";
import { ReservationStateButtons } from "./reservation-state-buttons";

export type ReservationDetailProps = { locale: Locale; id: string };

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children || "–"}</dd>
    </div>
  );
}

/** `/reservations/{id}`: facts edited in place per section, state steps on the title row. */
export async function ReservationDetail({ locale, id }: ReservationDetailProps) {
  const [t, abilities, found, rooms, needs, format] = await Promise.all([
    getTranslations("reservation"),
    getCallerAbilities(),
    loadReservation({ id }),
    loadDiningRoomOptions(),
    loadNeedOptions(),
    getDateTimeFormat(),
  ]);
  if (!found.ok) return <ErrorState errorKey={handleLoadError({ error: found.error, locale })} />;
  const reservation = found.value;
  const room = rooms.ok
    ? rooms.value.find((one) => one.itemId === reservation.roomItemId)
    : undefined;
  const timeZone = room?.timeZone ?? "UTC";
  const setup = await loadRoomTables({ roomItemId: reservation.roomItemId });
  const layoutId = setup.ok
    ? (
        setup.value.sittings.find((one) => one.id === reservation.serviceId) ??
        setup.value.sittings[0]
      )?.layoutId
    : undefined;
  const layout = setup.ok ? setup.value.layouts.find((one) => one.id === layoutId) : undefined;
  const tables = layout
    ? tablesOf({ layout }).map((table) => ({
        id: table.id,
        label: table.label,
        seats: table.seats,
      }))
    : [];
  const names = new Map((needs.ok ? needs.value : []).map((need) => [need.id, need.name]));
  const name = reservation.bookerName ?? t("anonymous");
  const canWrite = can({ abilities, permission: "reservation:write" });
  const open = NEXT_ACTIONS[reservation.state].length > 0;
  const startsAt = reservation.startsAt;
  const minutes = Math.round((reservation.endsAt.getTime() - startsAt.getTime()) / 60_000);
  const local = format.time({ instant: startsAt, timeZone });
  const date = dayOf({ instant: startsAt, timeZone });
  const when = whenDefaults({ reservation, date, time: local, durationMinutes: minutes });
  const erased = reservation.bookerName === null;
  return (
    <SimplePage>
      <div className="grid gap-8">
        <CrumbName href={reservationRoute({ id })} name={`${local} ${name}`} />
        <PageHeader
          title={name}
          description={room?.name}
          heading={
            <h1 className="flex flex-wrap items-center gap-3 text-3xl">
              {name}
              <StatusBadge label={t(`state.${reservation.state}`)} />
            </h1>
          }
          actions={
            canWrite ? <ReservationStateButtons id={id} state={reservation.state} /> : undefined
          }
        />
        <EditableSection
          title={t("detail.when")}
          editLabel={t("detail.editWhen")}
          canEdit={canWrite && open}
          editor={
            <WhenForm id={id} roomItemId={reservation.roomItemId} values={when} tables={tables} />
          }
        >
          <dl className="grid gap-4 sm:grid-cols-4">
            <Fact label={t("detail.date")}>
              {format.date({ instant: startsAt, timeZone, year: true, weekday: "short" })}
            </Fact>
            <Fact label={t("detail.time")}>
              {format.timeRange({ start: startsAt, end: reservation.endsAt, timeZone })}
            </Fact>
            <Fact label={t("detail.party")}>
              {t("detail.guests", { count: reservation.partySize })}
            </Fact>
            <Fact label={t("detail.tables")}>
              {reservation.tables.map((table) => table.label ?? "–").join(", ")}
            </Fact>
          </dl>
        </EditableSection>
        <EditableSection
          title={t("detail.booker")}
          editLabel={t("detail.editBooker")}
          canEdit={canWrite && open && !erased}
          editor={<BookerForm id={id} values={bookerDefaults({ reservation })} />}
        >
          <dl className="grid gap-4 sm:grid-cols-4">
            <Fact label={t("detail.name")}>{name}</Fact>
            <Fact label={t("detail.phone")}>{reservation.bookerPhone}</Fact>
            <Fact label={t("detail.email")}>{reservation.bookerEmail}</Fact>
            <Fact label={t("detail.source")}>{t(`source.${reservation.source}`)}</Fact>
          </dl>
          {reservation.note ? (
            <p className="text-sm whitespace-pre-line">{reservation.note}</p>
          ) : null}
        </EditableSection>
        <EditableSection
          title={t("needs.title")}
          editLabel={t("detail.editNeeds")}
          canEdit={canWrite && open && needs.ok}
          editor={
            <NeedsForm
              id={id}
              values={needsDefaults({ reservation })}
              options={needs.ok ? needs.value : []}
            />
          }
        >
          <p className="text-sm">
            {needsLabel({ needs: reservation.requirements, names }) || t("detail.noNeeds")}
          </p>
        </EditableSection>
        {canWrite && open ? <ReservationDangerArea id={id} name={name} /> : null}
      </div>
    </SimplePage>
  );
}
