"use client";

import type { ReservationViewData } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type ReservationWireOf = GenerativeProps<"reservation-card">["reservation"];

/**
 * Turns a reservation's wire form into what the shared view shows: times in the organization's
 * zone, state and warning words translated. The wire carries list value ids only, so needs show
 * as counts ("Needs 3") (ADR 0119).
 */
export function useReservationData() {
  const t = useTranslations("assistant.ui.reservation");
  const dates = useDateTimeFormat();
  return ({ reservation }: { reservation: ReservationWireOf }): ReservationViewData => ({
    time: `${dates.date({ instant: reservation.startsAt, weekday: "short" })} ${dates.timeRange({ start: reservation.startsAt, end: reservation.endsAt })}`,
    party: t("guests", { count: reservation.partySize }),
    tables: reservation.tables.map((table) => table.label ?? "–"),
    name: reservation.bookerName,
    state: { label: t(`state.${reservation.state}`) },
    needs: reservation.requirements.map((need) => t("needs", { count: need.quantity })),
    warnings: (reservation.warnings ?? []).map((warning) => t(`warning.${warning}`)),
    note: reservation.note,
  });
}
