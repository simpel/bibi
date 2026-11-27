"use client";

import type { PublicBookingPageDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type NeedLists = PublicBookingPageDto["needLists"];

export type NeedsSectionProps = {
  lists: NeedLists;
  party: number;
  /** Count per list value id; missing = 0. */
  counts: Record<string, number>;
  onChange: (input: { id: string; count: number }) => void;
};

/** Counts per list value, never who: a stepper from 0 to the party size for each value. */
export function NeedsSection({ lists, party, counts, onChange }: NeedsSectionProps) {
  const t = useTranslations("guestBooking.details");
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-muted px-3 py-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium">{t("needsTitle")}</h3>
        <p className="text-xs text-muted-foreground">{t("needsHint")}</p>
      </div>
      {lists.map((list) => (
        <div key={list.name} className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">{list.name}</p>
          {list.values.map(({ id, name }) => {
            const count = counts[id] ?? 0;
            return (
              <div key={id} className="flex items-center justify-between gap-3 text-sm">
                <span>{name}</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t("needsLess", { name })}
                    disabled={count <= 0}
                    onClick={() => onChange({ id, count: count - 1 })}
                  >
                    <MinusIcon aria-hidden />
                  </Button>
                  <span className="w-6 text-center tabular-nums">{count}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t("needsMore", { name })}
                    disabled={count >= party}
                    onClick={() => onChange({ id, count: count + 1 })}
                  >
                    <PlusIcon aria-hidden />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
