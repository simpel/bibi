"use client";

import type { PipelineBoard } from "@bibi/core";
import { KanbanBoard } from "@bibi/ui";
import { canMoveCard } from "../lib/move-rules";
import { PipelineCardContent } from "./pipeline-card";
import { useMoveCard } from "./use-move-card";
import { usePipelineLabels } from "./use-pipeline-labels";

export type PipelineBoardViewProps = {
  board: PipelineBoard;
  transitions: Readonly<Record<string, readonly string[]>>;
  /** Customer id → name; a card without one shows no customer (ADR 0050). */
  customerNames: Readonly<Record<string, string>>;
};

/** The kanban board of tickets by status; a drop runs `ticket.changeStatus`. */
export function PipelineBoardView({ board, transitions, customerNames }: PipelineBoardViewProps) {
  const labels = usePipelineLabels();
  const { move, dialog } = useMoveCard();
  const columns = board.columns.map((column) => ({
    id: column.id,
    title: column.title,
    color: column.color,
  }));
  const cards = board.cards.map((card) => {
    const customerName = customerNames[card.customerId] ?? null;
    return { ...card, customerName, title: customerName ?? `#${card.reference}` };
  });
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
