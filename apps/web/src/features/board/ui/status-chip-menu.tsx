import type { OrderStatusDto } from "@bibi/core/schemas";
import {
  DataTableRowActions,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  type KanbanPhaseData,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { BoardAccess } from "@/features/pipeline/load-pipeline-data";
import { ArchiveOrderStatusDialog } from "@/features/order-status/ui/archive-order-status-dialog";
import { EditOrderStatusItem } from "@/features/order-status/ui/edit-order-status-item";

export type StatusChipMenuProps = {
  orderStatus: OrderStatusDto;
  /** The column the chip is in; null = the tray. */
  phaseId: string | null;
  phases: readonly KanbanPhaseData[];
  statuses: readonly OrderStatusDto[];
  access: BoardAccess;
  onMove: (input: { statusId: string; toPhaseId: string | null }) => void;
};

type MoveToProps = Pick<StatusChipMenuProps, "orderStatus" | "phaseId" | "phases" | "onMove">;

/** "Move to" a column or the unphased column: the keyboard-free alternative to dragging a chip. */
function MoveToMenu({ orderStatus, phaseId, phases, onMove }: MoveToProps) {
  const t = useTranslations("boardPhase");
  const board = useTranslations("board.customize");
  const targets = [
    ...phases.map((phase) => ({ id: phase.id as string | null, name: phase.title })),
    { id: null, name: board("unphased") },
  ].filter((target) => target.id !== phaseId);
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{t("moveTo")}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {targets.map((target) => (
          <DropdownMenuItem
            key={target.id ?? "unphased"}
            onSelect={() => onMove({ statusId: orderStatus.id, toPhaseId: target.id })}
          >
            {target.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/**
 * A chip's menu. "Move to" is the board's (`board:write`); editing and archiving a status change
 * the flow for everyone and show only with `pipeline:write` / `pipeline:delete` (ADR 0076).
 */
export function StatusChipMenu(props: StatusChipMenuProps) {
  const { orderStatus, statuses, access } = props;
  const t = useTranslations("orderStatus");
  const phase = useTranslations("boardPhase");
  const [archiveOpen, setArchiveOpen] = useState(false);
  return (
    <>
      <DataTableRowActions compact label={phase("statusActions", { name: orderStatus.name })}>
        {access.configure ? <EditOrderStatusItem id={orderStatus.id} /> : null}
        <MoveToMenu {...props} />
        {access.configure && access.removeStatus ? (
          <DropdownMenuItem destructive onSelect={() => setArchiveOpen(true)}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      {archiveOpen ? (
        <ArchiveOrderStatusDialog
          orderStatus={orderStatus}
          statuses={statuses}
          open
          onOpenChange={(open) => !open && setArchiveOpen(false)}
        />
      ) : null}
    </>
  );
}
