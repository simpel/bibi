"use client";

import type { PipelineBoard } from "@bibi/core";
import { KanbanBoard } from "@bibi/ui";
import { findDrop, kanbanCards, kanbanColumns } from "../lib/kanban-model";
import { canMoveCard } from "../lib/move-rules";
import { PipelineCardContent } from "./pipeline-card";
import { useMoveCard } from "./use-move-card";
import { usePipelineLabels } from "./use-pipeline-labels";

export type PipelineBoardViewProps = {
  board: PipelineBoard;
  transitions: Readonly<Record<string, readonly string[]>>;
  /** Status id → the targets whose move from it needs a reason (a REASON gate). */
  reasonMoves: Readonly<Record<string, readonly string[]>>;
  /** Customer id → name; a card without one shows no customer (ADR 0050). */
  customerNames: Readonly<Record<string, string>>;
};

/**
 * The kanban board of tickets by phase (ADR 0067). A phase with several statuses splits into one
 * drop zone per status while a card is dragged; a drop runs `ticket.changeStatus` to that status.
 */
export function PipelineBoardView(props: PipelineBoardViewProps) {
  const { board, transitions, reasonMoves, customerNames } = props;
  const labels = usePipelineLabels();
  const { move, dialog } = useMoveCard({ reasonMoves });
  return (
    <>
      <KanbanBoard
        columns={kanbanColumns({ board })}
        cards={kanbanCards({ board, customerNames })}
        labels={labels}
        renderCard={(card) => <PipelineCardContent card={card} />}
        canDrop={(drop) => {
          const found = findDrop({ board, move: drop });
          return !!found && canMoveCard({ ...found, transitions });
        }}
        onMove={(drop) => {
          const found = findDrop({ board, move: drop });
          if (found) move({ card: found.card, to: found.to });
        }}
      />
      {dialog}
    </>
  );
}
