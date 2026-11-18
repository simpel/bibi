"use client";

import { CalendarLabelsProvider, OrderDayCard, useStoredState } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useCalendarText } from "@/features/calendar/ui/use-calendar-text";
import { useOrderFacts } from "@/features/order/ui/use-order-facts";
import { orderRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { cardSurface, isLive } from "../lib/card-surface";
import { toBooking } from "../lib/to-booking";
import { useFlagIssues } from "./my-work-flag";
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
 * flags as error and warning badges by the icons, its status as the first stat, Live as a green
 * badge by the icons with a green shimmering ring. Expanding loads the order's facts; a reload keeps it expanded.
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
  const at = new Date(now);
  const [reason] = card.reasons;
  const issues = useFlagIssues({ flags: card.flags, timeZone, dates });
  const live = isLive({ card, now: at });
  return (
    <CalendarLabelsProvider labels={labels}>
      <OrderDayCard
        booking={toBooking({ card, timeZone, issues })}
        href={orderRoute({ id: card.orderId })}
        surface={cardSurface({ card, now: at })}
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
        live={live ? t("live") : undefined}
      />
    </CalendarLabelsProvider>
  );
}
