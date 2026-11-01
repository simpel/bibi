import type { PlainDate } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { periodHref } from "../lib/finance-href";
import { type Period, shiftPeriod } from "../lib/finance-period";
import { PeriodRange } from "./period-range";

export type PeriodSwitcherProps = {
  period: Period;
  today: PlainDate;
  /** The page whose period is in the path, e.g. `/financials` or `/dashboard`. */
  base: string;
  customerId?: string | undefined;
};

/** Previous and next period of the same length, and the period's dates as the picker button. */
export function PeriodSwitcher({ period, today, base, customerId }: PeriodSwitcherProps) {
  const t = useTranslations("finance.period");
  const links = [
    { key: "previous", period: shiftPeriod({ period, direction: -1 }) },
    { key: "next", period: shiftPeriod({ period, direction: 1 }) },
  ] as const;
  return (
    <nav aria-label={t("label")} className="flex flex-wrap items-center gap-2">
      {links.map(({ key, period: target }) => (
        <Button key={key} asChild variant="outline" size="sm">
          <Link href={periodHref({ ...target, base, customerId })}>{t(key)}</Link>
        </Button>
      ))}
      <PeriodRange period={period} today={today} base={base} customerId={customerId} />
    </nav>
  );
}
