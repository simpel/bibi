import type { PipelineCard, PipelineColumn } from "@bibi/core";
import { useState } from "react";
import type { ActionError } from "@/lib/action-result";
import { MoveBlockersDialog } from "./move-blockers-dialog";
import { MoveReasonDialog } from "./move-reason-dialog";
import { useRunMove } from "./use-run-move";

export type MoveCardInput = { card: PipelineCard; to: PipelineColumn };

type Pending =
  | { kind: "reason"; card: PipelineCard; to: PipelineColumn }
  | { kind: "blockers"; card: PipelineCard; to: PipelineColumn; error: ActionError };

/**
 * Runs `ticket.changeStatus` behind a drop. A status that requires a reason asks for it first; a
 * refused move opens a dialog that lists every blocker instead of dropping the card.
 */
export function useMoveCard() {
  const [pending, setPending] = useState<Pending | null>(null);
  const run = useRunMove({
    onRefused: (refused) => setPending({ kind: "blockers", ...refused }),
    onMoved: () => setPending(null),
  });
  const move = ({ card, to }: MoveCardInput) => {
    if (to.requiresReason) setPending({ kind: "reason", card, to });
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
