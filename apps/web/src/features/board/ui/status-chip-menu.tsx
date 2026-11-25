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
import { EditOrderStatusItem } from "@/features/order-status/ui/edit-order-status-item";
import type { BoardAccess } from "@/features/pipeline/load-pipeline-data";

export type StatusChipMenuProps = {
  orderStatus: OrderStatusDto;
  /** The column the chip is in; null = the tray. */
  phaseId: string | null;
  phases: readonly KanbanPhaseData[];
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
 * A chip's menu. "Move to" is the view's (anyone who may edit it, ADR 0111); editing a status
 * changes the flow for everyone and shows only with `pipeline:write` (ADR 0076). A status is
 * archived on its own page (its danger area), never here.
 */
export function StatusChipMenu(props: StatusChipMenuProps) {
  const { orderStatus, access } = props;
  const phase = useTranslations("boardPhase");
  return (
    <DataTableRowActions compact label={phase("statusActions", { name: orderStatus.name })}>
      {access.configure ? <EditOrderStatusItem id={orderStatus.id} /> : null}
      <MoveToMenu {...props} />
    </DataTableRowActions>
  );
}
