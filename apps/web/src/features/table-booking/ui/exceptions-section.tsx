import { type ItemDto, listDiningServiceExceptions } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminBand } from "@/components/admin/admin-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { minuteToTime } from "../lib/clock";
import { dayOf, startOfDay } from "../lib/edge-time";
import {
  type ExceptionDefaultsInput,
  type ExceptionRow,
  exceptionDefaults,
} from "../lib/exception-form";
import { loadSittings } from "../load-room-settings";
import { CreateExceptionButton } from "./create-exception-button";
import { ExceptionsTable } from "./exceptions-table";

export type ExceptionsSectionProps = { locale: Locale; item: ItemDto };

/** Dates a sitting is closed or runs differently, from today on, one list for every sitting. */
export async function ExceptionsSection({ locale, item }: ExceptionsSectionProps) {
  const [t, abilities, sittings, format] = await Promise.all([
    getTranslations("tableBooking.exceptions"),
    getCallerAbilities(),
    loadSittings({ roomItemId: item.id }),
    getDateTimeFormat(),
  ]);
  const anchor = "exceptions";
  if (!sittings.ok) {
    return (
      <AdminBand anchor={anchor} title={t("title")}>
        <ErrorState errorKey={handleLoadError({ error: sittings.error, locale })} inline />
      </AdminBand>
    );
  }
  const timeZone = item.timeZone;
  const from = dayOf({ instant: new Date(), timeZone });
  const lists = await Promise.all(
    sittings.value.map((sitting) =>
      runOperation({
        operation: listDiningServiceExceptions,
        input: { serviceId: sitting.id, from },
      }),
    ),
  );
  const failed = lists.find((list) => !list.ok);
  if (failed && !failed.ok) {
    return (
      <AdminBand anchor={anchor} title={t("title")}>
        <ErrorState errorKey={handleLoadError({ error: failed.error, locale })} inline />
      </AdminBand>
    );
  }
  const layouts = item.layouts.map((layout) => ({ id: layout.layoutId, name: layout.name }));
  const summary = ({ exception }: { exception: ExceptionDefaultsInput }) => {
    if (exception.closed) return [t("closedSummary"), exception.note].filter(Boolean).join(" · ");
    const parts: string[] = [];
    if (exception.firstStartMinute !== null || exception.lastStartMinute !== null)
      parts.push(
        `${minuteToTime({ minute: exception.firstStartMinute ?? 0 })} – ${minuteToTime({ minute: exception.lastStartMinute ?? 1439 })}`,
      );
    const layout = layouts.find((one) => one.id === exception.layoutId);
    if (layout) parts.push(layout.name);
    if (exception.maxCoversPerSlot !== null)
      parts.push(t("paceSummary", { count: exception.maxCoversPerSlot }));
    if (exception.note) parts.push(exception.note);
    return parts.join(" · ") || "–";
  };
  const rows: ExceptionRow[] = lists.flatMap((list, index) =>
    (list.ok ? list.value.items : []).map((exception) => ({
      serviceId: exception.serviceId,
      serviceName: sittings.value[index]?.name ?? "",
      date: exception.date,
      dateLabel: format.date({
        instant: startOfDay({ day: exception.date, timeZone }),
        timeZone,
        year: true,
        weekday: "short",
      }),
      summary: summary({ exception }),
      values: exceptionDefaults({ ...exception }),
    })),
  );
  const access = rowAccess({ abilities, feature: "diningSetup" });
  const sittingOptions = sittings.value.map(({ id, name }) => ({ id, name }));
  const create = access.canEdit ? (
    <CreateExceptionButton sittings={sittingOptions} layouts={layouts} />
  ) : undefined;
  if (sittings.value.length === 0) return null;
  return (
    <AdminBand anchor={anchor} title={t("title")} description={t("description")} actions={create}>
      {rows.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <ExceptionsTable rows={rows} sittings={sittingOptions} layouts={layouts} access={access} />
      )}
    </AdminBand>
  );
}
