"use client";

import { addMonths, parseIsoDate, toIsoDate } from "@bibi/core/schemas";
import { Button, Input, Label } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { PlainDateButton } from "@/components/date-picker/plain-date-button";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { setDiningRoomAction } from "../actions";

export type OpenUntilControlProps = {
  itemId: string;
  slug: string;
  /** The first open local day (`YYYY-MM-DD`), "" = no start date. */
  fromDay: string;
  /** A rolling window in days from now; null = each sitting's own limit. */
  daysAhead: number | null;
  /** The last open local day (`YYYY-MM-DD`), "" = no limit. */
  day: string;
  /** Today in the room's zone: where "+1 month" starts when no day is set. */
  today: string;
  canEdit: boolean;
};

/**
 * The days guests can book, from and to. Each picker saves as soon as it changes (CLAUDE.md
 * "Forms"); the server turns the days into the start of the first and the end of the last day in
 * the room's zone (ADR 0064).
 */
export function OpenUntilControl({
  itemId,
  slug,
  fromDay,
  daysAhead,
  day,
  today,
  canEdit,
}: OpenUntilControlProps) {
  const t = useTranslations("tableBooking.openUntil");
  const common = useTranslations("common");
  const router = useRouter();
  const fromId = useId();
  const toId = useId();
  const aheadId = useId();
  const { run, pending } = useToastAction();
  const [from, setFrom] = useState(fromDay);
  const [until, setUntil] = useState(day);
  const [ahead, setAhead] = useState(daysAhead === null ? "" : String(daysAhead));
  const aheadValue = ahead.trim() === "" ? null : Number(ahead.trim());
  const aheadValid =
    aheadValue === null || (Number.isInteger(aheadValue) && aheadValue >= 1 && aheadValue <= 730);
  const saveAhead = () =>
    run({
      action: () => setDiningRoomAction({ itemId, slug, openDaysAhead: aheadValue }),
      messages: { pending: common("saving"), success: t("saved") },
      onSuccess: () => router.refresh(),
    });
  const save = ({ next, which }: { next: string; which: "from" | "until" }) => {
    const previous = which === "from" ? from : until;
    (which === "from" ? setFrom : setUntil)(next);
    const value = next === "" ? null : next;
    run({
      action: () =>
        setDiningRoomAction({
          ...{ itemId, slug },
          ...(which === "from" ? { openFromDay: value } : { openUntilDay: value }),
        }),
      messages: { pending: common("saving"), success: t("saved") },
      onSuccess: () => router.refresh(),
      onError: () => (which === "from" ? setFrom : setUntil)(previous),
    });
  };
  const plusMonth = () => {
    const start = parseIsoDate({ value: until && until > today ? until : from || today });
    save({ next: toIsoDate({ date: addMonths({ date: start, months: 1 }) }), which: "until" });
  };
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-2">
          <Label htmlFor={fromId}>{t("fromLabel")}</Label>
          <PlainDateButton
            id={fromId}
            value={from}
            onChange={(next) => save({ next, which: "from" })}
            clearable
            minDay={today}
            disabled={!canEdit || pending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={toId}>{t("toLabel")}</Label>
          <div className="flex flex-wrap items-center gap-2">
            <PlainDateButton
              id={toId}
              value={until}
              onChange={(next) => save({ next, which: "until" })}
              clearable
              minDay={from && from > today ? from : today}
              disabled={!canEdit || pending}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!canEdit || pending}
              onClick={plusMonth}
            >
              {t("plusMonth")}
            </Button>
          </div>
        </div>
      </div>
      <div className="grid max-w-xs gap-2">
        <Label htmlFor={aheadId}>{t("aheadLabel")}</Label>
        <div className="flex items-center gap-2">
          <Input
            id={aheadId}
            value={ahead}
            inputMode="numeric"
            placeholder={t("aheadPlaceholder")}
            aria-invalid={!aheadValid}
            disabled={!canEdit || pending}
            className="w-28"
            onChange={(event) => setAhead(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!canEdit || pending || !aheadValid || aheadValue === daysAhead}
            onClick={saveAhead}
          >
            {common("save")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("aheadHint")}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        {until || from ? t("hint") : t("noLimitHint")}
      </p>
    </div>
  );
}
