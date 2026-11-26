"use client";

import { Button } from "@bibi/ui";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LiveQueryState } from "@/lib/live-query-state";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { AvailabilityOutput } from "../actions";

export type SlotChoice = AvailabilityOutput["slots"][number];

export type CreateReservationSlotsProps = {
  state: LiveQueryState<AvailabilityOutput>;
  /** The chosen start, an ISO instant. */
  chosen: string;
  onChoose: (slot: SlotChoice) => void;
};

/** The times of the day for the party, per sitting; taken ones are greyed, warnings marked. */
export function CreateReservationSlots({ state, chosen, onChoose }: CreateReservationSlotsProps) {
  const t = useTranslations("reservation.create");
  const warnings = useTranslations("reservation.warning");
  const errors = useTranslations("errors");
  const dates = useDateTimeFormat();
  if (state.status === "idle")
    return <p className="text-sm text-muted-foreground">{t("pickParty")}</p>;
  if (state.status === "error")
    return <p className="text-sm text-destructive">{errors(state.errorKey)}</p>;
  const value = state.status === "ready" ? state.value : state.previous;
  if (!value) return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  if (value.slots.length === 0)
    return <p className="text-sm text-muted-foreground">{t("noSlots")}</p>;
  const groups = new Map<string, SlotChoice[]>();
  for (const slot of value.slots)
    groups.set(slot.serviceName, [...(groups.get(slot.serviceName) ?? []), slot]);
  return (
    <div className="grid gap-3">
      {[...groups].map(([name, slots]) => (
        <section key={name} className="grid gap-1.5">
          <h4 className="text-sm font-medium">{name}</h4>
          <ul className="flex flex-wrap gap-1.5">
            {slots.map((slot) => {
              const iso = new Date(slot.startsAt).toISOString();
              return (
                <li key={iso}>
                  <Button
                    type="button"
                    size="sm"
                    variant={chosen === iso ? "default" : "outline"}
                    aria-pressed={chosen === iso}
                    className={slot.available ? undefined : "text-muted-foreground line-through"}
                    onClick={() => onChoose(slot)}
                  >
                    {dates.time({ instant: slot.startsAt, timeZone: value.timeZone })}
                    {slot.warnings.length > 0 ? (
                      <TriangleAlertIcon
                        aria-label={slot.warnings.map((warning) => warnings(warning)).join(" · ")}
                        className="text-warning-foreground"
                      />
                    ) : null}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
