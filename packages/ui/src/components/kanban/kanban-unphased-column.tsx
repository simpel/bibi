import type { ReactNode } from "react";
import { KanbanChipList } from "./kanban-chip-list";
import type {
  KanbanCustomizeLabels,
  KanbanCustomizeSlots,
  KanbanStatusChipData,
} from "./kanban-customize-types";

export type KanbanUnphasedColumnProps = {
  /** Statuses on no column of this board. */
  statuses: readonly KanbanStatusChipData[];
  labels: KanbanCustomizeLabels;
  renderChipMenu?: KanbanCustomizeSlots["renderChipMenu"];
  footer?: ReactNode;
};

/**
 * The column on the far left of customize mode with the statuses that are on no column of this
 * board: drag a chip here to take it off the board, or out to place it. It never moves or flips.
 */
export function KanbanUnphasedColumn({
  statuses,
  labels,
  renderChipMenu,
  footer,
}: KanbanUnphasedColumnProps) {
  return (
    <section
      data-slot="kanban-unphased-column"
      aria-label={labels.unphased}
      className="flex w-72 shrink-0 snap-start flex-col gap-2 rounded-xl border border-dashed p-2"
    >
      <h2 className="px-1 py-1 text-sm font-medium text-muted-foreground">{labels.unphased}</h2>
      <KanbanChipList
        containerId={null}
        statuses={statuses}
        emptyLabel={labels.unphasedEmpty}
        countLabel={labels.count}
        renderChipMenu={renderChipMenu}
      />
      {footer}
    </section>
  );
}
