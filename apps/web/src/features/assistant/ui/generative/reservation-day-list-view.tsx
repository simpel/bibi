"use client";

import { ReservationDayList } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { GenerativeProps } from "./generative-props";
import { useReservationData } from "./use-reservation-data";

export type ReservationDayListViewProps = GenerativeProps<"reservation-day-list">;

/** A day's reservations with the totals above them. */
export function ReservationDayListView({ items, totals }: ReservationDayListViewProps) {
  const t = useTranslations("assistant.ui.reservation");
  const data = useReservationData();
  return (
    <ReservationDayList
      reservationsLabel={t("reservations", { count: totals.reservations })}
      coversLabel={t("covers", { count: totals.covers })}
      needs={totals.needs.map((need) => t("needs", { count: need.quantity }))}
      rows={items.map((reservation) => ({ id: reservation.id, ...data({ reservation }) }))}
      emptyLabel={t("empty")}
      tablesLabel={t("table")}
      anonymousLabel={t("anonymous")}
    />
  );
}
