"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { CalendarHold, Money } from "./calendar-types";

/** Every word the calendar writes, from the app's translations, with times in the user's clock. */
export type CalendarLabels = {
  levels: { day: string; week: string; month: string; custom: string };
  range: string;
  earlier: string;
  today: string;
  later: string;
  rangePresets: { last7Days: string; last30Days: string; last3Months: string; last6Months: string };
  jumpInTime: string;
  search: string;
  searchPlaceholder: string;
  searchLabel: string;
  assetGroups: string;
  allAssets: string;
  groupCount: (input: { count: number }) => string;
  searchGroups: string;
  noGroupMatch: string;
  noMatch: (input: { query: string; groups: readonly string[] }) => string;
  addBooking: (input: { asset: string }) => string;
  clash: (input: { from: string; to: string }) => string;
  dayCell: (input: {
    asset: string;
    day: string;
    percent: number;
    count: number;
    clash: boolean;
  }) => string;
  openDay: (input: { label: string }) => string;
  client: string;
  internal: string;
  blocked: string;
  notSold: string;
  guests: (input: { count: number }) => string;
  /** Where the guests are on an order's lanes: "Guests here", or with how many. */
  guestsHere: (input: { count?: number }) => string;
  guestsAt: (input: { place: string }) => string;
  lineCount: (input: { count: number }) => string;
  /** Heading of an order's lines with no time yet. */
  unscheduled: string;
  /** Minutes after midnight in the user's clock format: `14:05` or `2:05 PM`. */
  clock: (input: { minutes: number }) => string;
  /** A whole hour on an axis: `14` or `2 PM`. */
  hour: (input: { hour: number }) => string;
  /** An amount in the user's money format. */
  money: (money: Money) => string;
  exclVat: (input: { amount: string }) => string;
  /** The same amount for an animated number (NumberFlow), in the user's number format. */
  moneyFlow: (input: { currency: string }) => {
    locales: string;
    format: { minimumFractionDigits: number; maximumFractionDigits: number };
    prefix: string;
    suffix: string;
  };
  /** A day's value in its heading: booked, prebooked and still open, excl. VAT. */
  value: {
    booked: string;
    prebooked: string;
    open: string;
    note: string;
    /** Next to the day: "48% booked". */
    rate: (input: { percent: number }) => string;
  };
  open: (input: { order: string }) => string;
  /** Pinning a booking's card to the tray at the bottom, to compare it with others. */
  pin: (input: { name: string }) => string;
  unpin: (input: { name: string }) => string;
  pinned: string;
  /** A pinned booking's card. */
  pinCard: {
    when: string;
    where: string;
    state: string;
    guests: string;
    value: string;
    exclVat: string;
    hold: string;
    minutes: (input: { count: number }) => string;
    seeOrder: string;
    minimize: (input: { name: string }) => string;
    expand: (input: { name: string }) => string;
  };
  openLine: string;
  notes: string;
  staff: string;
  fromOrder: (input: { via: string }) => string;
  holds: Record<CalendarHold, string>;
  buffers: string;
  buffersText: string;
};

const CalendarLabelsContext = createContext<CalendarLabels | null>(null);

export function CalendarLabelsProvider({
  labels,
  children,
}: {
  labels: CalendarLabels;
  children: ReactNode;
}) {
  return <CalendarLabelsContext value={labels}>{children}</CalendarLabelsContext>;
}

export function useOptionalCalendarLabels(): CalendarLabels | null {
  return useContext(CalendarLabelsContext);
}

/** The calendar's words; every part of it sits inside `CalendarLabelsProvider`. */
export function useCalendarLabels(): CalendarLabels {
  const labels = useContext(CalendarLabelsContext);
  if (!labels) throw new Error("useCalendarLabels needs a CalendarLabelsProvider");
  return labels;
}
