import type { ItemDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminBand } from "@/components/admin/admin-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { minuteToTime } from "../lib/clock";
import { dayOf } from "../lib/edge-time";
import { sittingDefaults } from "../lib/sitting-form";
import type { SittingRow } from "../lib/sitting-row";
import { weekdaysLabel } from "../lib/weekdays";
import { loadSittings } from "../load-room-settings";
import { CreateSittingButton } from "./create-sitting-button";
import { SittingTable } from "./sitting-table";

export type SittingsSectionProps = { locale: Locale; item: ItemDto };

/** The sittings of a room: when it takes bookings, with which layout and at what pace. */
export async function SittingsSection({ locale, item }: SittingsSectionProps) {
  const [t, days, abilities, sittings, format] = await Promise.all([
    getTranslations("tableBooking.sittings"),
    getTranslations("tableBooking.weekdays"),
    getCallerAbilities(),
    loadSittings({ roomItemId: item.id }),
    getDateTimeFormat(),
  ]);
  const anchor = "sittings";
  if (!sittings.ok) {
    return (
      <AdminBand anchor={anchor} title={t("title")}>
        <ErrorState errorKey={handleLoadError({ error: sittings.error, locale })} inline />
      </AdminBand>
    );
  }
  const access = rowAccess({ abilities, feature: "diningSetup" });
  const layouts = item.layouts.map((layout) => ({ id: layout.layoutId, name: layout.name }));
  const names = (["0", "1", "2", "3", "4", "5", "6"] as const).map((day) => days(day));
  const timeZone = item.timeZone;
  const season = ({ sitting }: { sitting: (typeof sittings.value)[number] }) => {
    const { validFrom, validUntil } = sitting;
    if (!validFrom && !validUntil) return t("allYear");
    const date = ({ instant }: { instant: Date }) => format.date({ instant, timeZone, year: true });
    if (validFrom && validUntil)
      return `${date({ instant: validFrom })} – ${date({ instant: validUntil })}`;
    return validFrom
      ? t("from", { date: date({ instant: validFrom }) })
      : t("until", { date: date({ instant: validUntil as Date }) });
  };
  const rows: SittingRow[] = sittings.value.map((sitting) => ({
    id: sitting.id,
    name: sitting.name,
    weekdays: sitting.weekdays,
    weekdaysLabel: weekdaysLabel({ days: sitting.weekdays, names }),
    startsLabel: `${minuteToTime({ minute: sitting.firstStartMinute })} – ${minuteToTime({ minute: sitting.lastStartMinute })}`,
    layoutName: layouts.find((layout) => layout.id === sitting.layoutId)?.name ?? "–",
    covers: sitting.maxCoversPerSlot === null ? "–" : String(sitting.maxCoversPerSlot),
    season: season({ sitting }),
    values: sittingDefaults({
      sitting,
      from: dayOf({ instant: sitting.validFrom, timeZone }),
      until: dayOf({ instant: sitting.validUntil, timeZone }),
    }),
  }));
  const create = access.canEdit ? (
    <CreateSittingButton roomItemId={item.id} layouts={layouts} />
  ) : undefined;
  return (
    <AdminBand anchor={anchor} title={t("title")} description={t("description")} actions={create}>
      {rows.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <SittingTable roomItemId={item.id} rows={rows} layouts={layouts} access={access} />
      )}
    </AdminBand>
  );
}
