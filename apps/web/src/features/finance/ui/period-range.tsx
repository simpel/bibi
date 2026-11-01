"use client";

import {
  Button,
  Calendar,
  calendarLocales,
  type DateRange,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bibi/ui";
import { CalendarRangeIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { dateOfDay, periodOfRange, rangeOfPeriod } from "@/lib/time/period-dates";
import { periodHref } from "../lib/finance-href";
import { isValidPeriod, MAX_PERIOD_MONTHS, type Period } from "../lib/finance-period";

export type PeriodRangeProps = {
  period: Period;
  /** The page whose period is in the path, e.g. `/financials`. */
  base: string;
  customerId?: string | undefined;
};

type RangeFormProps = PeriodRangeProps & { onDone: () => void };

function RangeForm({ period, base, customerId, onDone }: RangeFormProps) {
  const t = useTranslations("finance.period");
  const locale = useLocale();
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>(rangeOfPeriod({ period }));
  const draft = periodOfRange({ range });
  const complete = draft.from !== "" && draft.to !== "";
  const valid = complete && isValidPeriod(draft);
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        onDone();
        router.push(periodHref({ ...draft, base, customerId }));
      }}
    >
      <Calendar
        mode="range"
        numberOfMonths={2}
        weekStartsOn={1}
        locale={locale === "sv" ? calendarLocales.sv : calendarLocales.en}
        defaultMonth={dateOfDay({ day: period.from })}
        selected={range}
        onSelect={setRange}
      />
      {complete && !valid ? (
        <p className="px-2 text-xs text-destructive">
          {t("invalid", { months: MAX_PERIOD_MONTHS })}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={!valid}>
        {t("show")}
      </Button>
    </form>
  );
}

/** A calendar to pick first and last day, for a span the preset buttons do not cover. */
export function PeriodRange(props: PeriodRangeProps) {
  const t = useTranslations("finance.period");
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarRangeIcon aria-hidden />
          {t("custom")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-2">
        <RangeForm {...props} onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
