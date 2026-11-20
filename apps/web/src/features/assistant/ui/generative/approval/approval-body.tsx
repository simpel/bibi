"use client";

import type { ApprovalRequired } from "@bibi/ai";
import { CardContent } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { HelpTip } from "@/components/help/help-tip";
import type { ApprovalEdits, EditValue } from "../../../lib/approval-edits";
import { ApprovalErrorLine } from "./approval-error-line";
import { ChangeDetails } from "./change-details";
import type { DecisionState } from "./use-approval-decision";

export type ApprovalBodyProps = {
  approval: ApprovalRequired;
  state: DecisionState;
  decided: boolean;
  acknowledged: boolean;
  onAcknowledge: (input: { acknowledged: boolean }) => void;
  edits: ApprovalEdits;
  onEdit: (input: { path: string; value: EditValue }) => void;
};

/** What the change does and any error; a confirmed proposal shows `ApprovalDone` instead. */
export function ApprovalBody({
  approval,
  state,
  decided,
  acknowledged,
  onAcknowledge,
  edits,
  onEdit,
}: ApprovalBodyProps) {
  const t = useTranslations("helpHints");
  return (
    <CardContent className="grid gap-3 p-4 pt-0">
      {decided ? null : (
        <HelpTip id="assistant-approval" title={t("assistantApproval.title")}>
          {t("assistantApproval.text")}
        </HelpTip>
      )}
      <ChangeDetails
        input={approval.input}
        preview={approval.preview}
        acknowledged={acknowledged}
        onAcknowledge={onAcknowledge}
        decided={decided}
        edits={edits}
        onEdit={onEdit}
      />
      <ApprovalErrorLine state={state} />
    </CardContent>
  );
}
