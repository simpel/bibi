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

/**
 * A chip's menu. "Move to" is the board's (`board:write`); editing and archiving a status change
 * the flow for everyone and show only with `pipeline:write` / `pipeline:delete` (ADR 0076).
 */
export function StatusChipMenu(props: StatusChipMenuProps) {
  const { ticketStatus, statuses, access } = props;
  const t = useTranslations("ticketStatus");
  const phase = useTranslations("boardPhase");
  const [archiveOpen, setArchiveOpen] = useState(false);
  return (
    <>
      <DataTableRowActions compact label={phase("statusActions", { name: ticketStatus.name })}>
        {access.configure ? <EditTicketStatusItem id={ticketStatus.id} /> : null}
        <MoveToMenu {...props} />
        {access.configure && access.removeStatus ? (
          <DropdownMenuItem destructive onSelect={() => setArchiveOpen(true)}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      {archiveOpen ? (
        <ArchiveTicketStatusDialog
          ticketStatus={ticketStatus}
          statuses={statuses}
          open
          onOpenChange={(open) => !open && setArchiveOpen(false)}
        />
      ) : null}
    </>
  );
}
