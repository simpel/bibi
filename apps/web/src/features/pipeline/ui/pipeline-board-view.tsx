"use client";

import type { PipelineBoard } from "@bibi/core";
import type { TransitionGate } from "@bibi/core/schemas";
import { KanbanBoard } from "@bibi/ui";
import { useState } from "react";
import { TicketSheet } from "@/features/ticket/sheet/ui/ticket-sheet";
import { findDrop, kanbanCards, kanbanColumns } from "../lib/kanban-model";
import { PhaseValue } from "./phase-value";
import { PipelineCardContent } from "./pipeline-card";
import { useMoveCard } from "./use-move-card";
import { usePipelineLabels } from "./use-pipeline-labels";

export type PipelineBoardViewProps = {
  board: PipelineBoard;
  transitions: Readonly<Record<string, readonly string[]>>;
  /** Status id → target id → the gates of that move (ADR 0067 §5). */
  moveGates: Readonly<Record<string, Readonly<Record<string, readonly TransitionGate[]>>>>;
  /** Customer id → name; a card without one shows no customer (ADR 0050). */
  customerNames: Readonly<Record<string, string>>;
};

/**
 * The kanban board of tickets by phase (ADR 0067, 0076). A drop on a phase runs
 * `ticket.changeStatus`: straight into its only allowed status, or after the picker when it
 * holds several. A card's title opens the ticket's sheet beside the board.
 */
export function PipelineBoardView(props: PipelineBoardViewProps) {
  const { board, transitions, moveGates, customerNames } = props;
  const labels = usePipelineLabels();
  const { drop, dialog } = useMoveCard({ moveGates });
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <>
      <KanbanBoard
        columns={kanbanColumns({ board })}
        cards={kanbanCards({ board, customerNames })}
        labels={labels}
        renderCard={(card) => (
          <PipelineCardContent card={card} onOpen={({ ticketId }) => setOpenId(ticketId)} />
        )}
        renderSummary={({ cards }) => (
          <PhaseValue cards={cards} currency={board.currency} size="sm" />
        )}
        canDrop={(move) => {
          const found = findDrop({ board, move, transitions });
          // Another phase is always a drop (with a message when nothing may move there); inside
          // its own phase the card must have somewhere to go.
          return !!found && (move.toColumnId !== move.fromColumnId || found.targets.length > 0);
        }}
        onMove={(move) => {
          const found = findDrop({ board, move, transitions });
          if (found) drop({ card: found.card, column: found.column, targets: found.targets });
        }}
      />
      {dialog}
      <TicketSheet ticketId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
