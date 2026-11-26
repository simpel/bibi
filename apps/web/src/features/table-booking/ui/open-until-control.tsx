"use client";

import { addMonths, parseIsoDate, toIsoDate } from "@bibi/core/schemas";
import { Button, Label } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { PlainDateButton } from "@/components/date-picker/plain-date-button";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { setDiningRoomAction } from "../actions";

export type OpenUntilControlProps = {
  itemId: string;
  slug: string;
  /** The last open local day (`YYYY-MM-DD`), "" = no limit. */
  day: string;
  /** Today in the room's zone: where "+1 month" starts when no day is set. */
  today: string;
  canEdit: boolean;
};

/**
 * The last day guests can book. A picker saves as soon as it changes (CLAUDE.md "Forms"); the
 * server turns the day into the end of that day in the room's zone (ADR 0064).
 */
export function OpenUntilControl({ itemId, slug, day, today, canEdit }: OpenUntilControlProps) {
  const t = useTranslations("tableBooking.openUntil");
  const common = useTranslations("common");
  const router = useRouter();
  const id = useId();
  const { run, pending } = useToastAction();
  const [current, setCurrent] = useState(day);
  const change = ({ next }: { next: string }) => {
    const previous = current;
    setCurrent(next);
    run({
      action: () => setDiningRoomAction({ itemId, slug, openUntilDay: next === "" ? null : next }),
      messages: { pending: common("saving"), success: t("saved") },
      onSuccess: () => router.refresh(),
      onError: () => setCurrent(previous),
    });
  };
  const plusMonth = () => {
    const from = parseIsoDate({ value: current && current > today ? current : today });
    change({ next: toIsoDate({ date: addMonths({ date: from, months: 1 }) }) });
  };
  return (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor={id}>{t("label")}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <PlainDateButton
          id={id}
          value={current}
          onChange={(next) => change({ next })}
          clearable
          minDay={today}
          disabled={!canEdit || pending}
        />
        <Button type="button" variant="outline" disabled={!canEdit || pending} onClick={plusMonth}>
          {t("plusMonth")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{current ? t("hint") : t("noLimitHint")}</p>
    </div>
  );
}
