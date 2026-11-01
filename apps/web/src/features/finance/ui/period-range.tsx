"use client";

import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger } from "@bibi/ui";
import { CalendarRangeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { financialsHref } from "../lib/finance-href";
import { isValidPeriod, MAX_PERIOD_MONTHS, type Period } from "../lib/finance-period";

export type PeriodRangeProps = { period: Period; customerId?: string | undefined };

type RangeFieldsProps = { draft: Period; onChange: (draft: Period) => void };

function RangeFields({ draft, onChange }: RangeFieldsProps) {
  const t = useTranslations("finance.period");
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["from", "to"] as const).map((key) => (
        <div key={key} className="grid gap-1.5">
          <Label htmlFor={`finance-range-${key}`}>{t(key)}</Label>
          <Input
            id={`finance-range-${key}`}
            type="date"
            value={draft[key]}
            onChange={(event) => onChange({ ...draft, [key]: event.target.value })}
          />
        </div>
      ))}
    </div>
  );
}

/** Two dates, first and last day, for a span the preset buttons do not cover. */
export function PeriodRange({ period, customerId }: PeriodRangeProps) {
  const t = useTranslations("finance.period");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(period);
  const complete = draft.from !== "" && draft.to !== "";
  const valid = complete && isValidPeriod(draft);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarRangeIcon aria-hidden />
          {t("custom")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(18rem,calc(100vw-2rem))]">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid) return;
            setOpen(false);
            router.push(financialsHref({ ...draft, customerId }));
          }}
        >
          <RangeFields draft={draft} onChange={setDraft} />
          {complete && !valid ? (
            <p className="text-xs text-destructive">
              {t("invalid", { months: MAX_PERIOD_MONTHS })}
            </p>
          ) : null}
          <Button type="submit" size="sm" disabled={!valid}>
            {t("show")}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
