import type { DateTimeFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { MY_WORK_SECTIONS, type MyWorkSection, sectionOf } from "../lib/my-work-window";
import { MyWorkDays } from "./my-work-days";
import type { MyWorkCardWireish, MyWorkWireish } from "./my-work-wireish";

export type MyWorkTimelineProps = {
  work: MyWorkWireish;
  dates: DateTimeFormat;
  /** Read on as the member scrolls, at the end of Later (the start page only). */
  later?: ReactNode;
  /** The member's tasks today (ADR 0117), at the top of Today; null or absent when none. */
  todayTasks?: ReactNode;
};

/**
 * The start page's timeline in four parts, Today, This week, Next week and Later, each with its
 * days and cards (spec: home). Today always shows; an empty part otherwise does not.
 */
export function MyWorkTimeline({ work, dates, later, todayTasks }: MyWorkTimelineProps) {
  const t = useTranslations("myWork");
  const { cards, timeZone } = work;
  if (cards === null) return null;
  const now = new Date(work.now);
  const parts = new Map<MyWorkSection, MyWorkCardWireish[]>();
  for (const card of cards) {
    const section = sectionOf({ day: card.day, today: work.from });
    parts.set(section, [...(parts.get(section) ?? []), card]);
  }
  return (
    <div data-slot="my-work-timeline" className="grid gap-8">
      {MY_WORK_SECTIONS.map((section) => {
        const list = parts.get(section) ?? [];
        const shown = section === "today" || list.length > 0 || (section === "later" && later);
        if (!shown) return null;
        return (
          <section key={section} className="grid gap-4">
            <h2 className="border-b pb-1.5 font-serif text-xl">{t(`sections.${section}`)}</h2>
            {section === "today" ? todayTasks : null}
            {section === "today" && list.length === 0 && !todayTasks ? (
              <p className="text-sm text-muted-foreground">{t("emptyToday")}</p>
            ) : null}
            <MyWorkDays
              cards={list}
              now={now}
              timeZone={timeZone}
              dates={dates}
              dayHeadings={section !== "today"}
            />
            {section === "later" ? later : null}
          </section>
        );
      })}
    </div>
  );
}
