import { useState } from "react";
import { type Completion, completion, type SwitchQuestion, switchQuestion } from "./complete-step";
import type { SwitchChoice } from "./draft-lines";
import { periodOf } from "./intake-period";
import type { IntakePick, IntakeWhen } from "./intake-state";
import type { IntakeReview } from "./review-state";
import type { PackagePreview } from "./use-package-preview";

export type UsePackageNextInput = {
  when: IntakeWhen;
  pick: IntakePick | null;
  review: IntakeReview | null;
  timeZone: string;
  preview: PackagePreview;
  onNext: (input: Completion) => void;
};

/** The picked package's entry in the preview; null for a one-off or while it loads. */
function entryOf({ pick, preview }: Pick<UsePackageNextInput, "pick" | "preview">) {
  if (pick?.kind !== "PACKAGE" || preview.status !== "ready") return null;
  return preview.preview.entries.find(({ templateId }) => templateId === pick.templateId) ?? null;
}

/**
 * Step 3's Next: the lines step 4 starts with (ADR 0081), after asking what happens to lines that
 * exist when the pick changed. A package waits for its preview.
 */
export function usePackageNext({
  when,
  pick,
  review,
  timeZone,
  preview,
  onNext,
}: UsePackageNextInput) {
  const [question, setQuestion] = useState<SwitchQuestion | null>(null);
  const entry = entryOf({ pick, preview });
  const ready = pick !== null && (pick.kind === "ONE_OFF" || entry !== null);
  const finish = ({ choice }: { choice?: SwitchChoice }) => {
    const period = periodOf({ when, timeZone });
    if (!pick || !period || !ready) return;
    const newKey = () => crypto.randomUUID();
    onNext(completion({ review, pick, period, entry, newKey, ...(choice ? { choice } : {}) }));
    setQuestion(null);
  };
  const next = () => {
    if (!pick) return;
    const asked = switchQuestion({ review, pick });
    if (asked) setQuestion(asked);
    else finish({});
  };
  return { ready, next, question, choose: finish, cancel: () => setQuestion(null) };
}
