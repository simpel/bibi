"use client";

import { Card } from "@okazi/ui";
import { PhaseHistoryList } from "@/features/ticket/ui/phase-history-list";
import { PhaseWarnings } from "@/features/ticket/ui/phase-warnings";
import type { GenerativeProps } from "./generative-props";

export type TicketPhaseHistoryViewProps = GenerativeProps<"ticket-phase-history">;

/** A ticket's phase history, newest first, and the facts that contradict its phase (ADR 0054). */
export function TicketPhaseHistoryView({ history }: TicketPhaseHistoryViewProps) {
  return (
    <Card data-slot="ticket-phase-history" className="gap-2 px-4 py-3 shadow-none">
      <PhaseWarnings warnings={history.warnings} />
      <PhaseHistoryList items={history.items} />
    </Card>
  );
}
