"use client";

import type { ReservationState } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { NEXT_ACTIONS, type StaffAction } from "../lib/reservation-row";
import { useReservationState } from "./use-reservation-state";

export type ReservationStateButtonsProps = { id: string; state: ReservationState };

/** The next steps of the reservation's life on the title row; cancelling is in the danger area. */
export function ReservationStateButtons({ id, state }: ReservationStateButtonsProps) {
  const t = useTranslations("reservation.actions");
  const { change, pending } = useReservationState();
  const next = NEXT_ACTIONS[state].filter(
    (action): action is Exclude<StaffAction, "cancel"> => action !== "cancel",
  );
  return (
    <>
      {next.map((action, index) => (
        <Button
          key={action}
          variant={index === 0 ? "default" : "outline"}
          className="h-12 px-5 text-base"
          disabled={pending}
          onClick={() => change({ id, action })}
        >
          {t(action)}
        </Button>
      ))}
    </>
  );
}
