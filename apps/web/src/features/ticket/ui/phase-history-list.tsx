import type { TicketPhaseChangeDto } from "@bibi/core/schemas";
import { useFormatter, useTranslations } from "next-intl";

/** A phase change as the server (Date) or a tool result (ISO string) carries it. */
export type PhaseChangeValue = Omit<TicketPhaseChangeDto, "changedAt"> & {
  changedAt: Date | string;
};

export type PhaseHistoryListProps = {
  /** Oldest first, as `ticket.phaseHistory` returns them; shown newest first. */
  items: readonly PhaseChangeValue[];
  /** Phase id → name; without it an entry says only that the phase changed. */
  phaseNames?: ReadonlyMap<string, string>;
};

/**
 * The ticket's phase history (ADR 0054), newest first: the phase entered, what made the move,
 * when, and the reason. Shared by the ticket page and the assistant's tool card.
 */
export function PhaseHistoryList({ items, phaseNames }: PhaseHistoryListProps) {
  const t = useTranslations("ticket.phaseHistory");
  const format = useFormatter();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <ol data-slot="phase-history-list" className="divide-y">
      {[...items].reverse().map((item) => {
        const when = new Date(item.changedAt);
        const phase = phaseNames?.get(item.toPhaseId);
        return (
          <li key={item.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
            <span className="font-medium">{phase ? t("entered", { phase }) : t("changed")}</span>
            <span className="text-muted-foreground">{t(`trigger.${item.trigger}`)}</span>
            <time className="text-xs text-muted-foreground" dateTime={when.toISOString()}>
              {format.dateTime(when, { dateStyle: "medium", timeStyle: "short" })}
            </time>
            {item.reason ? (
              <span className="basis-full text-muted-foreground">{item.reason}</span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
