"use client";

import type { PipelineBoard } from "@bibi/core";
import type { TransitionGate } from "@bibi/core/schemas";
import { KanbanBoard } from "@bibi/ui";
import { useState } from "react";
import { OrderSheet } from "@/features/order/sheet/ui/order-sheet";
import { useRouter } from "@/lib/navigation";
import { taskRoute } from "@/lib/routes";
import { boardCardSurface } from "../lib/board-card-surface";
import {
  type BoardItem,
  findDrop,
  kanbanCards,
  kanbanColumns,
  kanbanTaskCards,
  orderItems,
} from "../lib/kanban-model";
import { CreateOrderFooter } from "./create-order-footer";
import { PhaseValue } from "./phase-value";
import { PipelineCardContent } from "./pipeline-card";
import { PipelineTaskCardContent } from "./pipeline-task-card";
import { useMoveCard } from "./use-move-card";
import { usePipelineLabels } from "./use-pipeline-labels";

export type PipelineBoardViewProps = {
  board: PipelineBoard;
  transitions: Readonly<Record<string, readonly string[]>>;
  /** Status id → target id → the gates of that move (ADR 0067 §5). */
  moveGates: Readonly<Record<string, Readonly<Record<string, readonly TransitionGate[]>>>>;
  /** Customer id → name; a card without one shows no customer (ADR 0050). */
  customerNames: Readonly<Record<string, string>>;
  memberNames: Readonly<Record<string, string>>;
};

/**
 * The kanban board of orders by phase (ADR 0067, 0076), with the open tasks without an order
 * after the orders of their phase (ADR 0121). A drop on a phase runs `order.changeStatus` (a task
 * card: `task.move`): straight into its only allowed status, or after the picker when it holds
 * several. An order card opens the order's sheet beside the board, a task card its page.
 */
export function PipelineBoardView(props: PipelineBoardViewProps) {
  const { board, transitions, moveGates, customerNames, memberNames } = props;
  const labels = usePipelineLabels();
  const { drop, dialog } = useMoveCard({ moveGates });
  const [openId, setOpenId] = useState<string | null>(null);
  const router = useRouter();
  const now = new Date();
  const names = { board, customerNames, memberNames };
  const items: BoardItem[] = [...kanbanCards(names), ...kanbanTaskCards(names)];
  const entryColumnIds = new Set(
    board.columns.filter((c) => c.statuses.some((s) => s.entry)).map((c) => c.id),
  );
  return (
    <>
      <KanbanBoard
        columns={kanbanColumns({ board })}
        cards={items}
        labels={labels}
        renderCard={(card) =>
          card.kind === "order" ? (
            <PipelineCardContent card={card} />
          ) : (
            <PipelineTaskCardContent card={card} />
          )
        }
        onOpenCard={({ card }) =>
          card.kind === "order" ? setOpenId(card.id) : router.push(taskRoute({ id: card.id }))
        }
        cardSurface={({ card }) =>
          card.kind === "order" ? boardCardSurface({ card, now }) : undefined
        }
        renderSummary={({ cards }) => (
          <PhaseValue cards={orderItems({ items: cards })} currency={board.currency} size="sm" />
        )}
        renderFooter={({ column }) =>
          entryColumnIds.has(column.id) ? <CreateOrderFooter /> : null
        }
        canDrop={(move) => {
          const found = findDrop({ board, move, transitions });
          // Another phase is always a drop (with a message when nothing may move there); inside
          // its own phase the card must have somewhere to go.
          return !!found && (move.toColumnId !== move.fromColumnId || found.targets.length > 0);
        }}
        onMove={(move) => {
          const found = findDrop({ board, move, transitions });
          if (found) drop({ subject: found.subject, column: found.column, targets: found.targets });
        }}
      />
      {dialog}
      <OrderSheet orderId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
