"use client";

import {
  type AssetBooking,
  AvailabilityCalendar,
  type CalendarAsset,
  CalendarLabelsProvider,
  CalendarLegend,
  type CalendarState,
} from "@bibi/ui";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { useAssistant } from "@/features/assistant/state/assistant-context";
import { useRouter } from "@/lib/navigation";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useCalendarText } from "./use-calendar-text";
import { useLoadedBookings } from "./use-loaded-bookings";

export type CalendarViewProps = {
  assets: CalendarAsset[];
  /** The bookings of `range`, loaded with the page. */
  bookings: AssetBooking[];
  /** The path's days, shown first. */
  range: { from: string; to: string };
  today: string;
};

/** The states on screen once each, for the legend; manual blocks get their own entry. */
function legendOf({ bookings }: { bookings: readonly AssetBooking[] }) {
  const states = new Map<string, CalendarState>();
  let blocked: CalendarState | undefined;
  for (const booking of bookings) {
    if (!booking.ticket) blocked = booking.state;
    else states.set(`${booking.state.name}:${booking.state.color}`, booking.state);
  }
  return { states: [...states.values()], blocked };
}

/** The path follows the days on screen, so a link or reload opens the same place. */
function keepInPath({ from, to }: { from: string; to: string }) {
  const path = window.location.pathname.replace(/\/calendar(\/[^/]+\/[^/]+)?$/, "/calendar");
  window.history.replaceState(window.history.state, "", `${path}/${from}/${to}`);
}

/** The availability calendar on the page: loads days as it scrolls, opens tickets, books. */
export function CalendarView({ assets, bookings: initial, range, today }: CalendarViewProps) {
  const t = useTranslations("calendar");
  const labels = useCalendarText();
  const locale = useLocale();
  const format = useDateTimeFormat();
  const router = useRouter();
  const { prefill } = useAssistant();
  const { bookings, failed, onRangeChange } = useLoadedBookings({ initial, range });
  const legend = useMemo(() => legendOf({ bookings }), [bookings]);
  const onShownChange = useCallback(keepInPath, []);
  return (
    <CalendarLabelsProvider labels={labels}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-card">
        <AvailabilityCalendar
          {...{ assets, bookings, today, locale, labels, onRangeChange, onShownChange }}
          layout="page"
          className="flex-1"
          formatDate={format.date}
          initialRange={range}
          onOpen={(booking) => (booking.href ? router.push(booking.href) : undefined)}
          onAdd={({ asset, date, start }) =>
            prefill({ text: t("bookPrompt", { space: asset.name, date, time: start }) })
          }
        />
        <div className="grid shrink-0 gap-2 border-t px-4 py-2.5 sm:px-6">
          {failed ? <p className="text-sm text-destructive">{t("loadFailed")}</p> : null}
          <CalendarLegend states={legend.states} withBlocked={legend.blocked} />
        </div>
      </div>
    </CalendarLabelsProvider>
  );
}
