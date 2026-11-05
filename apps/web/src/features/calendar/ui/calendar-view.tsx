"use client";

import {
  type AssetBooking,
  AvailabilityCalendar,
  type CalendarAsset,
  type CalendarDayValue,
  CalendarLabelsProvider,
  CalendarLegend,
  type CalendarState,
  type CalendarWindow,
} from "@bibi/ui";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, use, useCallback, useEffect, useMemo, useState } from "react";
import { useAssistant } from "@/features/assistant/state/assistant-context";
import { OrderSheet } from "@/features/order/sheet/ui/order-sheet";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useCalendarText } from "./use-calendar-text";
import { useLoadedBookings } from "./use-loaded-bookings";

export type CalendarViewProps = {
  assets: CalendarAsset[];
  /**
   * The bookings of `range` and what each item's days are worth, streamed after the grid paints
   * (ADR 0097); `null` when the load failed.
   */
  load: Promise<CalendarLoad | null>;
  /** The path's days, shown first. */
  range: { from: string; to: string };
  today: string;
  /** The venues' widest opening hours; the calendar's office day without them. */
  openingHours?: CalendarWindow | undefined;
};

/** The states on screen once each, for the legend; manual blocks get their own entry. */
function legendOf({ bookings }: { bookings: readonly AssetBooking[] }) {
  const states = new Map<string, CalendarState>();
  let blocked: CalendarState | undefined;
  for (const booking of bookings) {
    if (!booking.order) blocked = booking.state;
    else states.set(`${booking.state.name}:${booking.state.color}`, booking.state);
  }
  return { states: [...states.values()], blocked };
}

/** Below the calendar: a failed load, and the legend of what is on screen. */
function CalendarFooter({ bookings, failed }: { bookings: AssetBooking[]; failed: boolean }) {
  const t = useTranslations("calendar");
  const legend = useMemo(() => legendOf({ bookings }), [bookings]);
  return (
    <div className="grid shrink-0 gap-2 border-t px-4 py-2.5 sm:px-6">
      {failed ? <p className="text-sm text-destructive">{t("loadFailed")}</p> : null}
      <CalendarLegend states={legend.states} withBlocked={legend.blocked} />
    </div>
  );
}

type CalendarLoad = { bookings: AssetBooking[]; values: CalendarDayValue[] };

type SeedBookingsProps = {
  load: Promise<CalendarLoad | null>;
  seed: (loaded: CalendarLoad | null) => void;
};

/** Hands the streamed first days to the timeline once they arrive. Renders nothing. */
function SeedBookings({ load, seed }: SeedBookingsProps) {
  const loaded = use(load);
  // Syncs the server's streamed promise into the timeline's state, once per page load.
  useEffect(() => seed(loaded), [loaded, seed]);
  return null;
}

/** The path follows the days on screen, so a link or reload opens the same place. */
function keepInPath({ from, to }: { from: string; to: string }) {
  const path = window.location.pathname.replace(/\/calendar(\/[^/]+\/[^/]+)?$/, "/calendar");
  window.history.replaceState(window.history.state, "", `${path}/${from}/${to}`);
}

/** The availability calendar on the page: loads days as it scrolls, opens orders, books. */
export function CalendarView(props: CalendarViewProps) {
  const { assets, load, range, today, openingHours } = props;
  const t = useTranslations("calendar");
  const labels = useCalendarText();
  const locale = useLocale();
  const format = useDateTimeFormat();
  const { prefill } = useAssistant();
  const { bookings, values, failed, onRangeChange, seed } = useLoadedBookings({ range });
  const onShownChange = useCallback(keepInPath, []);
  const [open, setOpen] = useState<AssetBooking | null>(null);
  return (
    <CalendarLabelsProvider labels={labels}>
      <Suspense fallback={null}>
        <SeedBookings load={load} seed={seed} />
      </Suspense>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-card">
        <AvailabilityCalendar
          {...{ assets, bookings, values, today, locale, labels, onRangeChange, onShownChange }}
          layout="page"
          className="flex-1"
          formatDate={format.date}
          initialRange={range}
          {...(openingHours ? { openingHours } : {})}
          selectedId={open?.id}
          onOpen={setOpen}
          onAdd={({ asset, date, start, end }) =>
            prefill({ text: t("bookPrompt", { space: asset.name, date, time: `${start}–${end}` }) })
          }
        />
        <OrderSheet orderId={open?.orderId ?? null} onClose={() => setOpen(null)} />
        <CalendarFooter bookings={bookings} failed={failed} />
      </div>
    </CalendarLabelsProvider>
  );
}
