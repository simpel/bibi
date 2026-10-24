import type { ApprovalRequired } from "@bibi/ai";
import { CardContent } from "@bibi/ui";
import { ToolResultView } from "../tool-result-view";
import { ApprovalErrorLine } from "./approval-error-line";
import { ChangeDetails } from "./change-details";
import type { DecisionState } from "./use-approval-decision";

export type ApprovalBodyProps = {
  approval: ApprovalRequired;
  toolName: string | undefined;
  state: DecisionState;
  decided: boolean;
  acknowledged: boolean;
  onAcknowledge: (input: { acknowledged: boolean }) => void;
};

/** What the change does, any error, and the result once it was confirmed. */
export function ApprovalBody({
  approval,
  toolName,
  state,
  decided,
  acknowledged,
  onAcknowledge,
}: ApprovalBodyProps) {
  return (
    <CardContent className="grid gap-3 p-4 pt-0">
      <ChangeDetails
        input={approval.input}
        preview={approval.preview}
        acknowledged={acknowledged}
        onAcknowledge={onAcknowledge}
        decided={decided}
      />
      <ApprovalErrorLine state={state} />
      {state.status === "approved" && state.result ? (
        <ToolResultView
          toolName={toolName ?? approval.operation.replaceAll(".", "_")}
          output={state.result}
        />
      ) : null}
    </CardContent>
  );
}
