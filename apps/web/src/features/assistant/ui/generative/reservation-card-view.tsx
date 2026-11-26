"use client";

import { ReservationCard } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { GenerativeProps } from "./generative-props";
import { useReservationData } from "./use-reservation-data";

export type ReservationCardViewProps = GenerativeProps<"reservation-card">;

/** One reservation: time, party, tables, booker, state, needs and warnings. */
export function ReservationCardView({ reservation }: ReservationCardViewProps) {
  const t = useTranslations("assistant.ui.reservation");
  const data = useReservationData();
  return (
    <ReservationCard
      reservation={data({ reservation })}
      tablesLabel={t("table")}
      noTablesLabel={t("noTable")}
      anonymousLabel={t("anonymous")}
    />
  );
}
