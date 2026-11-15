"use client";

import { CalendarLabelsProvider, OrderDayCard, useStoredState } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useCalendarText } from "@/features/calendar/ui/use-calendar-text";
import { useOrderFacts } from "@/features/order/ui/use-order-facts";
import { orderRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { cardTone } from "../lib/card-tone";
import { toBooking } from "../lib/to-booking";
import { MyWorkFlag } from "./my-work-flag";
import type { MyWorkCardWireish } from "./my-work-wireish";

/** Everything about the order when the card is expanded (its day is already on the card). */
const EXPANDED = new Set([
  "customer",
  "contact",
  "assignee",
  "followers",
  "lines",
  "total",
  "balance",
  "issues",
]);

export type MyWorkCardProps = { card: MyWorkCardWireish; now: Date | string; timeZone: string };

/**
 * One order on one day, the same card as the pinned and hover calendar cards (spec: home): its
 * tone as the outline and the header's wash, pin and expand at the top right, the most urgent
 * flag at the bottom. Expanding loads the order's facts; a reload keeps it expanded.
 */
export function MyWorkCard({ card, now, timeZone }: MyWorkCardProps) {
  const t = useTranslations("myWork");
  const labels = useCalendarText();
  const dates = useDateTimeFormat();
  // Kept per card in the viewer's browser, so a reload keeps it open.
  const [expanded, setExpanded] = useStoredState({
    key: `bibi:my-work:expanded:${card.key}`,
    initial: false,
  });
  const facts = useOrderFacts({ orderId: card.orderId, enabled: expanded, keys: EXPANDED });
  const tone = cardTone({ card, now: new Date(now) });
  const [reason] = card.reasons;
  const [flag, ...rest] = card.flags;
  const live = tone === "live";
  return (
    <CalendarLabelsProvider labels={labels}>
      <OrderDayCard
        booking={toBooking({ card, timeZone })}
        href={orderRoute({ id: card.orderId })}
        tone={tone}
        date={
          card.dayCount > 1
            ? t("dayOf", { index: card.dayIndex, count: card.dayCount })
            : dates.date({ instant: new Date(card.startsAt), timeZone, weekday: "short" })
        }
        subtitle={[card.customerName, reason ? t(`reasons.${reason}`) : null]
          .filter(Boolean)
          .join(" · ")}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        facts={facts}
        footer={
          live || flag ? (
            <div className="flex flex-wrap items-center gap-2">
              {live ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[10px] text-success uppercase tracking-wide">
                  <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-success" />
                  {t("live")}
                </span>
              ) : null}
              {flag ? (
                <MyWorkFlag flag={flag} orderId={card.orderId} timeZone={timeZone} dates={dates} />
              ) : null}
              {rest.length > 0 ? (
                <span className="text-muted-foreground">{t("more", { count: rest.length })}</span>
              ) : null}
            </div>
          ) : undefined
        }
      />
    </CalendarLabelsProvider>
  );
}
