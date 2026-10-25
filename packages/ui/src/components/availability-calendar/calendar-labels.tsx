"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { CalendarHold, Money } from "./calendar-types";

/** Every word the calendar writes, from the app's translations. Times are already "HH:mm". */
export type CalendarLabels = {
  levels: { day: string; week: string; month: string; custom: string };
  range: string;
  earlier: string;
  today: string;
  later: string;
  customRange: string;
  firstDay: string;
  lastDay: string;
  showRange: string;
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
  /** Where the guests are on a ticket's lanes: "Guests here", or with how many. */
  guestsHere: (input: { count?: number }) => string;
  guestsAt: (input: { place: string }) => string;
  lineCount: (input: { count: number }) => string;
  /** An amount in the user's number format and currency display. */
  money: (money: Money) => string;
  exclVat: (input: { amount: string }) => string;
  open: (input: { ticket: string }) => string;
  openLine: string;
  notes: string;
  staff: string;
  fromTicket: (input: { via: string }) => string;
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

/** The calendar's words; every part of it sits inside `CalendarLabelsProvider`. */
export function useCalendarLabels(): CalendarLabels {
  const labels = useContext(CalendarLabelsContext);
  if (!labels) throw new Error("useCalendarLabels needs a CalendarLabelsProvider");
  return labels;
}
