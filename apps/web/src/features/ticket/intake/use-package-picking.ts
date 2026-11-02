import { useEffect, useRef, useState } from "react";
import { applyAnswers } from "./apply-answers";
import type { FollowUpRequest } from "./follow-up-dialog";
import { followUpQuestions } from "./follow-up-questions";
import type { FollowUpAnswers, IntakePick, IntakeWhen } from "./intake-state";
import type { PackageCardData, PackageOption } from "./package-groups";
import type { PackagePreview } from "./use-package-preview";

export type UsePackagePickingInput = {
  when: IntakeWhen;
  timeZone: string;
  onPick: (input: { pick: IntakePick; when?: IntakeWhen }) => void;
  onUnpick: () => void;
};

/** Opens the follow-up dialog when the package needs answers, else picks it as it is. */
export function usePackagePicking({ when, timeZone, onPick, onUnpick }: UsePackagePickingInput) {
  const [request, setRequest] = useState<FollowUpRequest | null>(null);
  const pickPackage = ({ card }: { card: PackageCardData }) => {
    const { id: templateId, name } = card.option;
    const questions = followUpQuestions({ entry: card.entry, headcount: when.guests });
    if (questions.length === 0) {
      onPick({ pick: { kind: "PACKAGE", templateId, name, answers: {} } });
      return;
    }
    onUnpick();
    setRequest({ templateId, name, questions });
  };
  const answered = ({ answers }: { answers: FollowUpAnswers }) => {
    if (!request) return;
    const { templateId, name, questions } = request;
    const next = applyAnswers({ when, questions, answers, timeZone });
    onPick({ pick: { kind: "PACKAGE", templateId, name, answers }, when: next });
    setRequest(null);
  };
  return { request, cancel: () => setRequest(null), pickPackage, answered };
}

export type UseSuggestedPickInput = {
  /** The package a read message suggests (ADR 0084), or null. */
  suggestedId: string | null;
  pick: IntakePick | null;
  preview: PackagePreview;
  packages: PackageOption[];
  pickPackage: (input: { card: PackageCardData }) => void;
};

/**
 * The suggested package is preselected once its preview is in, while nothing is picked: picked
 * as a click would, so its follow-up questions are still asked. Once per opening of step 3.
 */
export function useSuggestedPick({
  suggestedId,
  pick,
  preview,
  packages,
  pickPackage,
}: UseSuggestedPickInput) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !suggestedId || pick || preview.status !== "ready") return;
    done.current = true;
    const option = packages.find(({ id }) => id === suggestedId);
    const entry = preview.preview.entries.find(({ templateId }) => templateId === suggestedId);
    if (option && entry) pickPackage({ card: { option, entry } });
  }, [suggestedId, pick, preview, packages, pickPackage]);
}
