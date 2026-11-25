import { CalendarLegend, type CalendarState } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { HelpHint } from "@/components/help/help-hint";

export type AppCalendarLegendProps = {
  states: readonly CalendarState[];
  withBlocked?: CalendarState | undefined;
  /** Tasks are on screen (ADR 0117): their outlined swatch. */
  withTasks?: { name: string; text?: string } | undefined;
  className?: string;
};

/**
 * The calendar's legend, closed for good with its X (`HelpHint`): the states on screen, plus what
 * a staff user cannot guess (hard and soft holds, buffers, the blocked badge).
 */
export function AppCalendarLegend({
  states,
  withBlocked,
  withTasks,
  className,
}: AppCalendarLegendProps) {
  const t = useTranslations("helpHints.calendar-legend");
  const note = ({ kind }: { kind: "hard" | "soft" | "badge" }) => ({
    kind,
    name: t(`${kind}.name`),
    text: t(`${kind}.text`),
  });
  return (
    <HelpHint id="calendar-legend" floating className={className}>
      <CalendarLegend
        states={states}
        {...(withBlocked ? { withBlocked } : {})}
        {...(withTasks ? { withTasks } : {})}
        notes={[note({ kind: "hard" }), note({ kind: "soft" }), note({ kind: "badge" })]}
      />
    </HelpHint>
  );
}
