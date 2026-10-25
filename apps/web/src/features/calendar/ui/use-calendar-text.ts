import type { NumberFormat } from "@bibi/core/schemas";
import type { CalendarLabels } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useNumberFormat } from "@/lib/number/use-number-format";

type Translate = ReturnType<typeof useTranslations<"calendar">>;
type TextInput = { t: Translate; number: NumberFormat };

/** The toolbar: range, stepper, custom range, filter and search. */
function toolbarText({ t }: TextInput) {
  return {
    levels: {
      day: t("levels.day"),
      week: t("levels.week"),
      month: t("levels.month"),
      custom: t("levels.custom"),
    },
    ...{ range: t("range"), earlier: t("earlier"), today: t("today"), later: t("later") },
    ...{ customRange: t("customRange"), firstDay: t("firstDay"), lastDay: t("lastDay") },
    ...{ showRange: t("showRange"), jumpInTime: t("jumpInTime"), search: t("search") },
    ...{ searchPlaceholder: t("searchPlaceholder"), searchLabel: t("searchLabel") },
    ...{ assetGroups: t("assetGroups"), allAssets: t("allAssets") },
    groupCount: ({ count }: { count: number }) => t("groupCount", { count }),
    ...{ searchGroups: t("searchGroups"), noGroupMatch: t("noGroupMatch") },
    noMatch: ({ query, groups }: { query: string; groups: readonly string[] }) =>
      groups.length === 0
        ? t("noMatch", { query })
        : t("noMatchIn", { query, groups: groups.join(", ") }),
  } satisfies Partial<CalendarLabels>;
}

/** The track: adding, clashes and month cells. */
function trackText({ t }: TextInput) {
  return {
    addBooking: ({ asset }: { asset: string }) => t("addBooking", { asset }),
    clash: ({ from, to }: { from: string; to: string }) => t("clash", { from, to }),
    dayCell: ({ asset, day, percent, count, clash }: Parameters<CalendarLabels["dayCell"]>[0]) => {
      const booked = count === 0 ? t("free") : t("bookedShare", { percent, count });
      return t(clash ? "dayCellClash" : "dayCell", { asset, day, booked });
    },
    openDay: ({ label }: { label: string }) => t("openDay", { label }),
  } satisfies Partial<CalendarLabels>;
}

/** A booking's card and the legend. */
function bookingText({ t, number }: TextInput) {
  return {
    ...{ client: t("client"), internal: t("internal"), blocked: t("blocked") },
    notSold: t("notSold"),
    guests: ({ count }: { count: number }) => t("guests", { count }),
    guestsHere: ({ count }: { count?: number }) =>
      count ? t("guestsHereCount", { count }) : t("guestsHere"),
    guestsAt: ({ place }: { place: string }) => t("guestsAt", { place }),
    lineCount: ({ count }: { count: number }) => t("lineCount", { count }),
    money: ({ amount, currency }: { amount: number; currency: string }) =>
      number.money({ minor: Math.round(amount * 100), currency }),
    exclVat: ({ amount }: { amount: string }) => t("exclVat", { amount }),
    value: {
      ...{ booked: t("value.booked"), prebooked: t("value.prebooked"), open: t("value.open") },
      note: t("value.note"),
      rate: ({ percent }: { percent: number }) => t("value.rate", { percent }),
      share: ({ percent }: { percent: number }) => t("value.share", { percent }),
    },
    open: ({ ticket }: { ticket: string }) => t("open", { ticket }),
    ...{ openLine: t("openLine"), notes: t("notes"), staff: t("staff") },
    fromTicket: ({ via }: { via: string }) => t("fromTicket", { via }),
    holds: { hard: t("holds.hard"), soft: t("holds.soft"), none: t("holds.none") },
    ...{ buffers: t("buffers"), buffersText: t("buffersText") },
  } satisfies Partial<CalendarLabels>;
}

/** The calendar's words from next-intl, with amounts in the user's number format (#482). */
export function useCalendarText(): CalendarLabels {
  const t = useTranslations("calendar");
  const number = useNumberFormat();
  return useMemo(
    () => ({
      ...toolbarText({ t, number }),
      ...trackText({ t, number }),
      ...bookingText({ t, number }),
    }),
    [t, number],
  );
}
