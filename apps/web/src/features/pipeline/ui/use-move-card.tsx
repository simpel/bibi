import type { PipelineStatus } from "@bibi/core";
import type { TransitionGate } from "@bibi/core/schemas";
import { toast } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ActionError } from "@/lib/action-result";
import { type MoveSubject, pickGates } from "../lib/move-rules";
import { MoveBlockersDialog } from "./move-blockers-dialog";
import { MoveReasonDialog } from "./move-reason-dialog";
import { MoveStatusPickerDialog, type StatusPick } from "./move-status-picker-dialog";
import { useRunMove } from "./use-run-move";

export type MoveCardInput = { subject: MoveSubject; to: PipelineStatus };

export type DropCardInput = {
  subject: MoveSubject;
  /** The column dropped on and the statuses of it the card may move to. */
  column: { title: string };
  targets: readonly PipelineStatus[];
};

export type UseMoveCardInput = {
  /** Status id → target id → the gates of that move (ADR 0067 §5); gate-free moves are absent. */
  moveGates: Readonly<Record<string, Readonly<Record<string, readonly TransitionGate[]>>>>;
};

type Pending =
  | { kind: "pick"; subject: MoveSubject; pick: StatusPick }
  | { kind: "reason"; subject: MoveSubject; to: PipelineStatus }
  | { kind: "blockers"; subject: MoveSubject; to: PipelineStatus; error: ActionError };

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
 * Runs `order.changeStatus` (or `task.move` for a task card, ADR 0121) behind a drop (ADR 0076).
 * One allowed status moves at once, several open a picker, none refuses. An order move with a
 * REASON gate asks for the reason first; a refused move opens a dialog that lists every blocker
 * instead of dropping the card.
 */
export function useMoveCard({ moveGates }: UseMoveCardInput) {
  const t = useTranslations("pipeline");
  const [pending, setPending] = useState<Pending | null>(null);
  const run = useRunMove({
    onRefused: (refused) => setPending({ kind: "blockers", ...refused }),
    onMoved: () => setPending(null),
  });
  const move = ({ subject, to }: MoveCardInput) => {
    const asksReason =
      subject.kind === "order" && moveGates[subject.card.statusId]?.[to.id]?.includes("REASON");
    if (asksReason) setPending({ kind: "reason", subject, to });
    else void run({ subject, to });
  };
  const drop = ({ subject, column, targets }: DropCardInput) => {
    const [only] = targets;
    const refusal = subject.kind === "task" ? "noTaskMoves" : "noMoves";
    if (!only) return void toast.error(t(refusal, { column: column.title }));
    if (targets.length === 1) return move({ subject, to: only });
    const gates = pickGates({ subject, moveGates });
    setPending({ kind: "pick", subject, pick: { kind: subject.kind, column, targets, gates } });
  };
  const dialog = (
    <MoveDialogs
      pending={pending}
      onClose={() => setPending(null)}
      onPick={(to) => pending && move({ subject: pending.subject, to })}
      onReason={(reason) =>
        pending?.kind === "reason" && void run({ subject: pending.subject, to: pending.to, reason })
      }
    />
  );
  return { drop, dialog };
}
