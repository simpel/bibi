"use client";

import { AvailabilityGrid } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { GenerativeProps } from "./generative-props";

export type ReservationAvailabilityViewProps = GenerativeProps<"reservation-availability">;

/** The bookable times of a day, one group per sitting, in the room's zone. */
export function ReservationAvailabilityView({ timeZone, slots }: ReservationAvailabilityViewProps) {
  const t = useTranslations("assistant.ui.reservation");
  const dates = useDateTimeFormat();
  const groups = new Map<string, { id: string; name: string; slots: (typeof slots)[number][] }>();
  for (const slot of slots) {
    const group = groups.get(slot.serviceId) ?? {
      id: slot.serviceId,
      name: slot.serviceName,
      slots: [],
    };
    group.slots.push(slot);
    groups.set(slot.serviceId, group);
  }
  return (
    <AvailabilityGrid
      emptyLabel={t("noSittings")}
      unavailableLabel={t("unavailable")}
      groups={[...groups.values()].map((group) => ({
        id: group.id,
        name: group.name,
        slots: group.slots.map((slot) => ({
          time: dates.time({ instant: slot.startsAt, timeZone }),
          available: slot.available,
          warnings: slot.warnings.map((warning) => t(`warning.${warning}`)),
          detail:
            slot.coversInSlot > 0 ? t("alreadyComing", { count: slot.coversInSlot }) : undefined,
        })),
      }))}
    />
  );
}
