"use client";

import { Button, cn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Ref } from "react";
import { loadTone, type SlotLoad } from "../lib/slot-load";

const BAR = { low: "bg-chart-1", mid: "bg-chart-3", full: "bg-chart-5" } as const;

export type TimeSlotButtonProps = {
  label: string;
  chosen: boolean;
  load: SlotLoad;
  onChoose: () => void;
  buttonRef?: Ref<HTMLButtonElement> | undefined;
};

/** A time on the day's time bar with a thin bar under it: how much of the floor is taken then. */
export function TimeSlotButton({ label, chosen, load, onChoose, buttonRef }: TimeSlotButtonProps) {
  const t = useTranslations("reservation.floor");
  return (
    <Button
      ref={buttonRef}
      variant={chosen ? "default" : "outline"}
      aria-pressed={chosen}
      className="relative h-12 w-full px-4 pb-2.5 text-base tabular-nums"
      onClick={onChoose}
    >
      {label}
      <span className="sr-only">{t("load", { taken: load.taken, seats: load.seats })}</span>
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-2 bottom-1.5 h-1 overflow-hidden rounded-full",
          chosen ? "bg-primary-foreground/25" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "block h-full rounded-full",
            chosen ? "bg-primary-foreground" : BAR[loadTone({ ratio: load.ratio })],
          )}
          style={{ width: `${Math.round(load.ratio * 100)}%` }}
        />
      </span>
    </Button>
  );
}
