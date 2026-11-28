"use client";

import { Button, cn } from "@bibi/ui";
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
        <section key={name} className="grid gap-2">
          <h4 className="text-base font-medium">{name}</h4>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
            {slots.map((slot) => {
              const iso = new Date(slot.startsAt).toISOString();
              return (
                <li key={iso}>
                  <Button
                    type="button"
                    size="sm"
                    variant={chosen === iso ? "default" : "outline"}
                    aria-pressed={chosen === iso}
                    className={cn(
                      "h-12 w-full px-2 text-base",
                      !slot.available && "text-muted-foreground line-through",
                    )}
                    onClick={() => onChoose(slot)}
                  >
                    {dates.time({ instant: slot.startsAt, timeZone: value.timeZone })}
                    {slot.warnings.length > 0 ? (
                      <TriangleAlertIcon
                        aria-label={slot.warnings.map((warning) => warnings(warning)).join(" · ")}
                        className="size-5 text-warning-foreground"
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
