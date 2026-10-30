import type { PipelineCard, PipelineStatus } from "@bibi/core";
import { useState } from "react";
import type { ActionError } from "@/lib/action-result";
import { MoveBlockersDialog } from "./move-blockers-dialog";
import { MoveReasonDialog } from "./move-reason-dialog";
import { useRunMove } from "./use-run-move";

export type MoveCardInput = { card: PipelineCard; to: PipelineStatus };

export type UseMoveCardInput = {
  /** Status id → the targets whose move from it needs a reason (a REASON gate, ADR 0067). */
  reasonMoves: Readonly<Record<string, readonly string[]>>;
};

type Pending =
  | { kind: "reason"; card: PipelineCard; to: PipelineStatus }
  | { kind: "blockers"; card: PipelineCard; to: PipelineStatus; error: ActionError };

/**
 * Runs `ticket.changeStatus` behind a drop. A move whose transition has a REASON gate asks for the
 * reason first; a refused move opens a dialog that lists every blocker instead of dropping the card.
 */
export function useMoveCard({ reasonMoves }: UseMoveCardInput) {
  const [pending, setPending] = useState<Pending | null>(null);
  const run = useRunMove({
    onRefused: (refused) => setPending({ kind: "blockers", ...refused }),
    onMoved: () => setPending(null),
  });
  const move = ({ card, to }: MoveCardInput) => {
    if (reasonMoves[card.statusId]?.includes(to.id)) setPending({ kind: "reason", card, to });
    else void run({ card, to });
  };
  const dialog = (
    <>
      <MoveReasonDialog
        column={pending?.kind === "reason" ? pending.to : null}
        onCancel={() => setPending(null)}
        onSubmit={(reason) => pending && void run({ card: pending.card, to: pending.to, reason })}
      />
      <MoveBlockersDialog
        issues={pending?.kind === "blockers" ? pending.error.issues : null}
        title={pending?.kind === "blockers" ? pending.to.title : ""}
        onClose={() => setPending(null)}
      />
    </>
  );
  return { move, dialog };
}
