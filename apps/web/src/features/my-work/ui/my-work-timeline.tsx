import type { DateTimeFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { MyWorkCard } from "./my-work-card";
import type { MyWorkCardWireish, MyWorkWireish } from "./my-work-wireish";

export type MyWorkTimelineProps = { work: MyWorkWireish; dates: DateTimeFormat };

/** Cards (already by start) split into their days, in order. */
function byDay({ cards }: { cards: MyWorkCardWireish[] }) {
  const days: { day: string; cards: MyWorkCardWireish[] }[] = [];
  for (const card of cards) {
    const last = days.at(-1);
    if (last?.day === card.day) last.cards.push(card);
    else days.push({ day: card.day, cards: [card] });
  }
  return days;
}

/** The start page's timeline: a heading per day, the day's cards under it (spec: home). */
export function MyWorkTimeline({ work, dates }: MyWorkTimelineProps) {
  const t = useTranslations("myWork");
  const { cards, timeZone } = work;
  if (cards === null) return null;
  if (cards.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  const now = new Date(work.now);
  return (
    <div data-slot="my-work-timeline" className="grid gap-6">
      {byDay({ cards }).map(({ day, cards: dayCards }) => (
        <section key={day} className="grid gap-3">
          <h2 className="border-b pb-1.5 font-serif text-lg">
            {dates.date({ instant: dayCards[0]?.startsAt ?? day, timeZone, weekday: "long" })}
          </h2>
          <div className="grid gap-3">
            {dayCards.map((card) => (
              <MyWorkCard key={card.key} card={card} now={now} timeZone={timeZone} dates={dates} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
