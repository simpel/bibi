import { CardFooter } from "@bibi/ui";
import { ApprovalActions } from "./approval-actions";
import { ApprovalStatus } from "./approval-status";
import type { Decision } from "./post-decision";
import type { DecisionState } from "./use-approval-decision";

export type ApprovalFooterProps = {
  state: DecisionState;
  seconds: number;
  decided: boolean;
  blocked: boolean;
  onDecide: (input: { decision: Decision }) => void;
};

/** The countdown or outcome, and Cancel / Confirm until the proposal is decided. */
export function ApprovalFooter({
  state,
  seconds,
  decided,
  blocked,
  onDecide,
}: ApprovalFooterProps) {
  return (
    <CardFooter className="flex-wrap justify-between gap-2 p-4 pt-0">
      <ApprovalStatus state={state} seconds={seconds} />
      {decided ? null : (
        <ApprovalActions
          state={state}
          expired={seconds === 0}
          blocked={blocked}
          onDecide={onDecide}
        />
      )}
    </CardFooter>
  );
}
