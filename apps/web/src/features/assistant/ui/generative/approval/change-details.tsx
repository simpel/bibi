import type { ChangePreview } from "@bibi/core/schemas";
import { ChangeTable } from "./change-table";
import { ConsequenceList } from "./consequence-list";
import { InputList } from "./input-list";

export type ChangeDetailsProps = {
  input: unknown;
  preview: ChangePreview | undefined;
  acknowledged: boolean;
  onAcknowledge: (input: { acknowledged: boolean }) => void;
  decided: boolean;
};

/** Core's preview of the change when the proposal has one; older proposals show their input. */
export function ChangeDetails({
  input,
  preview,
  acknowledged,
  onAcknowledge,
  decided,
}: ChangeDetailsProps) {
  if (!preview) return <InputList input={input} />;
  return (
    <>
      <ChangeTable preview={preview} />
      <ConsequenceList
        consequences={preview.consequences}
        acknowledged={acknowledged}
        onAcknowledge={onAcknowledge}
        disabled={decided}
      />
    </>
  );
}
