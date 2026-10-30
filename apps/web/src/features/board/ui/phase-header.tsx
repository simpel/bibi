import type { KanbanPhaseData } from "@bibi/ui";
import {
  ColorSwatch,
  DataTableRowActions,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenuItem,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { BoardAccess } from "@/features/pipeline/load-pipeline-data";
import { PhaseForm } from "./phase-form";
import { RemovePhaseDialog } from "./remove-phase-dialog";

export type PhaseHeaderProps = {
  boardId: string;
  phase: KanbanPhaseData;
  /** Every column id in order, for "move left/right". */
  order: readonly string[];
  access: BoardAccess;
  onReorder: (input: { ids: string[] }) => void;
};

const swap = ({ ids, at, by }: { ids: readonly string[]; at: number; by: number }) => {
  const next = [...ids];
  const [moving, other] = [next[at], next[at + by]];
  if (moving === undefined || other === undefined) return null;
  next[at] = other;
  next[at + by] = moving;
  return next;
};

type PhaseMenuProps = Omit<PhaseHeaderProps, "boardId"> & {
  onOpen: (dialog: "edit" | "remove") => void;
};

function PhaseMenu({ phase, order, access, onReorder, onOpen }: PhaseMenuProps) {
  const t = useTranslations("boardPhase");
  const at = order.indexOf(phase.id);
  return (
    <DataTableRowActions label={t("actions", { name: phase.title })}>
      <DropdownMenuItem onSelect={() => onOpen("edit")}>{t("edit")}</DropdownMenuItem>
      {[-1, 1].map((by) => {
        const ids = swap({ ids: order, at, by });
        return ids ? (
          <DropdownMenuItem key={by} onSelect={() => onReorder({ ids })}>
            {t(by < 0 ? "moveLeft" : "moveRight")}
          </DropdownMenuItem>
        ) : null;
      })}
      {access.remove ? (
        <DropdownMenuItem destructive onSelect={() => onOpen("remove")}>
          {t("remove")}
        </DropdownMenuItem>
      ) : null}
    </DataTableRowActions>
  );
}

/** The back of a column: its name and colour, and a menu (edit, move, remove). */
export function PhaseHeader({ boardId, ...menu }: PhaseHeaderProps) {
  const t = useTranslations("boardPhase");
  const [dialog, setDialog] = useState<"edit" | "remove" | null>(null);
  const { phase } = menu;
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      {phase.color ? <ColorSwatch color={phase.color} /> : null}
      <span className="truncate">{phase.title}</span>
      <span className="ml-auto">
        <PhaseMenu {...menu} onOpen={setDialog} />
      </span>
      <Dialog open={dialog === "edit"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("edit")}</DialogTitle>
          </DialogHeader>
          <PhaseForm boardId={boardId} phase={phase} onDone={() => setDialog(null)} />
        </DialogContent>
      </Dialog>
      <RemovePhaseDialog
        phase={phase}
        open={dialog === "remove"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </div>
  );
}
