import type { PipelineCard, PipelineStatus } from "@bibi/core";
import type { TransitionGate } from "@bibi/core/schemas";
import { toast } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ActionError } from "@/lib/action-result";
import { MoveBlockersDialog } from "./move-blockers-dialog";
import { MoveReasonDialog } from "./move-reason-dialog";
import { MoveStatusPickerDialog, type StatusPick } from "./move-status-picker-dialog";
import { useRunMove } from "./use-run-move";

export type MoveCardInput = { card: PipelineCard; to: PipelineStatus };

export type DropCardInput = {
  card: PipelineCard;
  /** The column dropped on and the statuses of it the card may move to. */
  column: { title: string };
  targets: readonly PipelineStatus[];
};

export type UseMoveCardInput = {
  /** Status id → target id → the gates of that move (ADR 0067 §5); gate-free moves are absent. */
  moveGates: Readonly<Record<string, Readonly<Record<string, readonly TransitionGate[]>>>>;
};

type Pending =
  | { kind: "pick"; card: PipelineCard; pick: StatusPick }
  | { kind: "reason"; card: PipelineCard; to: PipelineStatus }
  | { kind: "blockers"; card: PipelineCard; to: PipelineStatus; error: ActionError };

type MoveDialogsProps = {
  pending: Pending | null;
  onClose: () => void;
  onPick: (to: PipelineStatus) => void;
  onReason: (reason: string) => void;
};

/** The picker, the reason dialog and the blockers dialog; at most one is open. */
function MoveDialogs({ pending, onClose, onPick, onReason }: MoveDialogsProps) {
  return (
    <>
      <MoveStatusPickerDialog
        pick={pending?.kind === "pick" ? pending.pick : null}
        onCancel={onClose}
        onPick={onPick}
      />
      <MoveReasonDialog
        column={pending?.kind === "reason" ? pending.to : null}
        onCancel={onClose}
        onSubmit={onReason}
      />
      <MoveBlockersDialog
        issues={pending?.kind === "blockers" ? pending.error.issues : null}
        title={pending?.kind === "blockers" ? pending.to.title : ""}
        onClose={onClose}
      />
    </>
  );
}

/**
 * Runs `ticket.changeStatus` behind a drop (ADR 0076). One allowed status moves at once, several
 * open a picker, none refuses. A move with a REASON gate asks for the reason first; a refused move
 * opens a dialog that lists every blocker instead of dropping the card.
 */
export function useMoveCard({ moveGates }: UseMoveCardInput) {
  const t = useTranslations("pipeline");
  const [pending, setPending] = useState<Pending | null>(null);
  const run = useRunMove({
    onRefused: (refused) => setPending({ kind: "blockers", ...refused }),
    onMoved: () => setPending(null),
  });
  const move = ({ card, to }: MoveCardInput) => {
    if (moveGates[card.statusId]?.[to.id]?.includes("REASON")) {
      setPending({ kind: "reason", card, to });
    } else void run({ card, to });
  };
  const drop = ({ card, column, targets }: DropCardInput) => {
    const [only] = targets;
    if (!only) return void toast.error(t("noMoves", { column: column.title }));
    if (targets.length === 1) return move({ card, to: only });
    const gates = moveGates[card.statusId] ?? {};
    setPending({ kind: "pick", card, pick: { column, targets, gates } });
  };
  const dialog = (
    <MoveDialogs
      pending={pending}
      onClose={() => setPending(null)}
      onPick={(to) => pending && move({ card: pending.card, to })}
      onReason={(reason) =>
        pending?.kind === "reason" && void run({ card: pending.card, to: pending.to, reason })
      }
    />
  );
  return { drop, dialog };
}
