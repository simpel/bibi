import type { TicketStatusDto } from "@bibi/core/schemas";
import type { KanbanCustomizeSlots, KanbanPhaseData, KanbanStatusMove } from "@bibi/ui";
import type { BoardCard } from "@/features/pipeline/lib/kanban-model";
import type { BoardAccess } from "@/features/pipeline/load-pipeline-data";
import { AddColumnButton } from "./add-column-button";
import { AddStatusButton } from "./add-status-button";
import { PhaseFront } from "./phase-front";
import { PhaseHeader } from "./phase-header";
import { StatusChipMenu } from "./status-chip-menu";

export type CustomizeSlotsInput = {
  boardId: string;
  phases: readonly KanbanPhaseData[];
  statuses: readonly TicketStatusDto[];
  cards: readonly BoardCard[];
  access: BoardAccess;
  onReorder: (input: { ids: string[] }) => void;
  onMove: (move: Pick<KanbanStatusMove, "statusId" | "toPhaseId">) => void;
};

/** What customize mode puts in the kanban's slots: fronts, headers, menus and add buttons. */
export function customizeSlots({
  boardId,
  phases,
  statuses,
  cards,
  access,
  onReorder,
  onMove,
}: CustomizeSlotsInput): KanbanCustomizeSlots {
  const order = phases.map((phase) => phase.id);
  return {
    renderFront: ({ phase }) => <PhaseFront phase={phase} cards={cards} />,
    renderPhaseHeader: ({ phase }) => (
      <PhaseHeader {...{ boardId, phase, order, access, onReorder }} />
    ),
    renderPhaseFooter: ({ phase }) => <AddStatusButton boardId={boardId} phaseId={phase.id} />,
    renderChipMenu: ({ status, phaseId }) => {
      const ticketStatus = statuses.find((candidate) => candidate.id === status.id);
      return ticketStatus ? (
        <StatusChipMenu {...{ ticketStatus, phaseId, phases, statuses, access, onMove }} />
      ) : null;
    },
    renderAddColumn: ({ position }) => (
      <AddColumnButton boardId={boardId} position={position} between={position < phases.length} />
    ),
    unphasedFooter: <AddStatusButton boardId={boardId} phaseId={null} />,
  };
}
