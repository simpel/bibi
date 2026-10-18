"use client";

import type { PipelineBoard } from "@okazi/core";
import { KanbanBoard } from "@okazi/ui";
import { canMoveCard } from "../lib/move-rules";
import { PipelineCardContent } from "./pipeline-card";
import { useMoveCard } from "./use-move-card";
import { usePipelineLabels } from "./use-pipeline-labels";

export type PipelineBoardViewProps = {
  board: PipelineBoard;
  transitions: Readonly<Record<string, readonly string[]>>;
};

/** The kanban board of tickets by phase; a drop runs `ticket.changePhase`. */
export function PipelineBoardView({ board, transitions }: PipelineBoardViewProps) {
  const labels = usePipelineLabels();
  const { move, dialog } = useMoveCard();
  const columns = board.columns.map((column) => ({
    id: column.id,
    title: column.title,
    color: column.color,
  }));
  const cards = board.cards.map((card) => ({ ...card, title: card.customerName }));
  const column = ({ id }: { id: string }) => board.columns.find((c) => c.id === id);

  return (
    <>
      <KanbanBoard
        columns={columns}
        cards={cards}
        labels={labels}
        renderCard={(card) => <PipelineCardContent card={card} />}
        canDrop={({ cardId, fromColumnId, toColumnId }) => {
          const card = board.cards.find((c) => c.id === cardId);
          const from = column({ id: fromColumnId });
          const to = column({ id: toColumnId });
          return !!card && !!from && !!to && canMoveCard({ card, from, to, transitions });
        }}
        onMove={({ cardId, toColumnId }) => {
          const card = board.cards.find((c) => c.id === cardId);
          const to = column({ id: toColumnId });
          if (card && to) move({ card, to });
        }}
      />
      {dialog}
    </>
  );
}
