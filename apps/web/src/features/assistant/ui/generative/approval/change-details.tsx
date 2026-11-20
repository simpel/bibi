import type { ChangePreview } from "@bibi/core/schemas";
import type { ApprovalEdits, EditValue } from "../../../lib/approval-edits";
import { ChangeTable } from "./change-table";
import { ConsequenceList } from "./consequence-list";
import { InputList } from "./input-list";

export type ChangeDetailsProps = {
  input: unknown;
  preview: ChangePreview | undefined;
  acknowledged: boolean;
  onAcknowledge: (input: { acknowledged: boolean }) => void;
  decided: boolean;
  edits: ApprovalEdits;
  onEdit: (input: { path: string; value: EditValue }) => void;
};

/** Core's preview of the change when the proposal has one; older proposals show their input. */
export function ChangeDetails({
  input,
  preview,
  acknowledged,
  onAcknowledge,
  decided,
  edits,
  onEdit,
}: ChangeDetailsProps) {
  if (!preview) return <InputList input={input} />;
  return (
    <>
      <ChangeTable preview={preview} edits={edits} onEdit={decided ? undefined : onEdit} />
      <ConsequenceList
        consequences={preview.consequences}
        acknowledged={acknowledged}
        onAcknowledge={onAcknowledge}
        disabled={decided}
      />
    </>
  );
}
