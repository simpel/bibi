"use client";

import { Card } from "@bibi/ui";
import { StatusHistoryList } from "@/features/ticket/ui/status-history-list";
import { StatusWarnings } from "@/features/ticket/ui/status-warnings";
import type { GenerativeProps } from "./generative-props";

export type TicketStatusHistoryViewProps = GenerativeProps<"ticket-status-history">;

/** A ticket's status history, newest first, and the facts that contradict its status (ADR 0054). */
export function TicketStatusHistoryView({ history }: TicketStatusHistoryViewProps) {
  return (
    <Card data-slot="ticket-status-history" className="gap-2 px-4 py-3 shadow-none">
      <StatusWarnings warnings={history.warnings} />
      <StatusHistoryList items={history.items} />
    </Card>
  );
}
