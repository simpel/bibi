import type { ReactNode } from "react";
import { KanbanChipList } from "./kanban-chip-list";
import type {
  KanbanCustomizeLabels,
  KanbanCustomizeSlots,
  KanbanStatusChipData,
} from "./kanban-customize-types";

export type KanbanStatusTrayProps = {
  /** Statuses on no column of this board. */
  statuses: readonly KanbanStatusChipData[];
  labels: KanbanCustomizeLabels;
  renderChipMenu?: KanbanCustomizeSlots["renderChipMenu"];
  footer?: ReactNode;
};

/** The "not on this board" tray: drag a chip here to take it off the board, or out to place it. */
export function KanbanStatusTray({
  statuses,
  labels,
  renderChipMenu,
  footer,
}: KanbanStatusTrayProps) {
  return (
    <section
      data-slot="kanban-status-tray"
      aria-label={labels.tray}
      className="grid gap-1 rounded-xl border border-dashed p-2"
    >
      <h2 className="px-1 text-xs font-medium text-muted-foreground">{labels.tray}</h2>
      <KanbanChipList
        containerId={null}
        statuses={statuses}
        emptyLabel={labels.trayEmpty}
        countLabel={labels.count}
        renderChipMenu={renderChipMenu}
        inline
      >
        {footer}
      </KanbanChipList>
    </section>
  );
}
