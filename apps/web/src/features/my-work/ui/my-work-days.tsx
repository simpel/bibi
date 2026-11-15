import type { DateTimeFormat } from "@bibi/core/schemas";
import { MyWorkCard } from "./my-work-card";
import type { MyWorkCardWireish } from "./my-work-wireish";

export type MyWorkDaysProps = {
  cards: readonly MyWorkCardWireish[];
  now: Date;
  timeZone: string;
  dates: DateTimeFormat;
  /** A heading per day; off for a part that is one day (Today). */
  dayHeadings?: boolean;
};

/** Cards (already by start) split into their days, in order. */
function byDay({ cards }: Pick<MyWorkDaysProps, "cards">) {
  const days: { day: string; cards: MyWorkCardWireish[] }[] = [];
  for (const card of cards) {
    const last = days.at(-1);
    if (last?.day === card.day) last.cards.push(card);
    else days.push({ day: card.day, cards: [card] });
  }
  return days;
}

/** The cards of a part of the timeline, a heading per day (spec: home). */
export function MyWorkDays({ cards, now, timeZone, dates, dayHeadings = true }: MyWorkDaysProps) {
  return byDay({ cards }).map(({ day, cards: dayCards }) => (
    <div key={day} className="grid gap-3">
      {dayHeadings ? (
        <h3 className="text-sm font-medium text-muted-foreground">
          {dates.date({ instant: dayCards[0]?.startsAt ?? day, timeZone, weekday: "long" })}
        </h3>
      ) : null}
      {dayCards.map((card) => (
        <MyWorkCard key={card.key} card={card} now={now} timeZone={timeZone} dates={dates} />
      ))}
    </div>
  ));
}
