import type { DateTimeFormat } from "@bibi/core/schemas";
import { OrderDayCard } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { orderRoute } from "@/lib/routes";
import { cardTone } from "../lib/card-tone";
import { MyWorkFlag } from "./my-work-flag";
import type { MyWorkCardWireish } from "./my-work-wireish";

export type MyWorkCardProps = {
  card: MyWorkCardWireish;
  now: Date;
  timeZone: string;
  dates: DateTimeFormat;
};

/** One order on one day: the pinned card's layout, its tone as the outline (spec: home). */
export function MyWorkCard({ card, now, timeZone, dates }: MyWorkCardProps) {
  const t = useTranslations("myWork");
  const tone = cardTone({ card, now });
  const start = new Date(card.startsAt);
  const when =
    card.dayCount > 1
      ? t("dayOf", { index: card.dayIndex, count: card.dayCount })
      : dates.date({ instant: start, timeZone, weekday: "short" });
  const [reason] = card.reasons;
  const facts = [
    ...(card.headcount ? [{ label: t("facts.guests"), value: card.headcount }] : []),
    {
      label: t("facts.when"),
      preheader: when,
      value: dates.timeRange({ start, end: new Date(card.endsAt), timeZone }),
    },
    ...(card.places?.length
      ? [{ label: t("facts.where"), value: card.places.join(", "), truncate: true }]
      : []),
  ];
  const [flag, ...rest] = card.flags;
  return (
    <OrderDayCard
      title={card.title ?? card.customerName ?? `#${card.reference}`}
      reference={`#${card.reference}`}
      subtitle={[card.customerName, reason ? t(`reasons.${reason}`) : null]
        .filter(Boolean)
        .join(" · ")}
      href={orderRoute({ id: card.orderId })}
      status={card.status}
      facts={facts}
      tone={tone}
      live={tone === "live" ? t("live") : undefined}
      flag={
        flag ? (
          <MyWorkFlag flag={flag} orderId={card.orderId} timeZone={timeZone} dates={dates} />
        ) : undefined
      }
      more={rest.length > 0 ? t("more", { count: rest.length }) : undefined}
    />
  );
}
