import type { TicketStatusDto } from "@bibi/core/schemas";
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
import { ArchiveTicketStatusDialog } from "@/features/ticket-status/ui/archive-ticket-status-dialog";
import { EditTicketStatusItem } from "@/features/ticket-status/ui/edit-ticket-status-item";
import { TransitionsDialog } from "@/features/ticket-status/ui/transitions-dialog";

export type StatusChipMenuProps = {
  ticketStatus: TicketStatusDto;
  /** The column the chip is in; null = the tray. */
  phaseId: string | null;
  phases: readonly KanbanPhaseData[];
  statuses: readonly TicketStatusDto[];
  access: BoardAccess;
  onMove: (input: { statusId: string; toPhaseId: string | null }) => void;
};

type MoveToProps = Pick<StatusChipMenuProps, "ticketStatus" | "phaseId" | "phases" | "onMove">;

/** "Move to" a column or the unphased column: the keyboard-free alternative to dragging a chip. */
function MoveToMenu({ ticketStatus, phaseId, phases, onMove }: MoveToProps) {
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
            onSelect={() => onMove({ statusId: ticketStatus.id, toPhaseId: target.id })}
          >
            {target.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/** A chip's menu: edit (page), transitions, move to, archive (with a target for its tickets). */
export function StatusChipMenu(props: StatusChipMenuProps) {
  const { ticketStatus, statuses, access } = props;
  const t = useTranslations("ticketStatus");
  const phase = useTranslations("boardPhase");
  const [dialog, setDialog] = useState<"transitions" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={phase("statusActions", { name: ticketStatus.name })}>
        <EditTicketStatusItem id={ticketStatus.id} />
        <DropdownMenuItem onSelect={() => setDialog("transitions")}>
          {t("editTransitions")}
        </DropdownMenuItem>
        <MoveToMenu {...props} />
        {access.remove ? (
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      {dialog === "transitions" ? (
        <TransitionsDialog
          ticketStatus={ticketStatus}
          statuses={statuses}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      ) : null}
      {dialog === "archive" ? (
        <ArchiveTicketStatusDialog
          ticketStatus={ticketStatus}
          statuses={statuses}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      ) : null}
    </>
  );
}
