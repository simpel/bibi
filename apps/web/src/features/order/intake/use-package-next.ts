import { useState } from "react";
import { type Completion, completion, replacesLines } from "./complete-step";
import type { DraftLine, NewKey } from "./draft-line";
import { type IntakePeriod, periodOf } from "./intake-period";
import type { IntakePick, IntakeWhen } from "./intake-state";
import type { IntakeReview } from "./review-state";
import type { PackagePreview } from "./use-package-preview";

export type UsePackageNextInput = {
  when: IntakeWhen;
  pick: IntakePick | null;
  review: IntakeReview | null;
  timeZone: string;
  preview: PackagePreview;
  onPick: (input: { pick: IntakePick }) => void;
  onNext: (input: Completion) => void;
  /** The lines a new custom booking starts with (the calendar slot's resource). */
  customLines: (input: { period: IntakePeriod; newKey: NewKey }) => DraftLine[];
};

/** The picked package's entry in the preview; null for a custom booking or while it loads. */
function entryOf({ pick, preview }: Pick<UsePackageNextInput, "pick" | "preview">) {
  if (pick?.kind !== "PACKAGE" || preview.status !== "ready") return null;
  return preview.preview.entries.find(({ templateId }) => templateId === pick.templateId) ?? null;
}

const CUSTOM: IntakePick = { kind: "ONE_OFF" };

/**
 * Step 3's ways on (ADR 0081): Next with the picked package, or Custom booking. Either asks
 * first when it replaces lines from another pick (spec "Replacing lines"). A package waits for
 * its preview.
 */
export function usePackageNext({
  when,
  pick,
  review,
  timeZone,
  preview,
  onPick,
  onNext,
  customLines,
}: UsePackageNextInput) {
  const [pending, setPending] = useState<IntakePick | null>(null);
  const entry = entryOf({ pick, preview });
  const ready = pick?.kind === "PACKAGE" && entry !== null;
  const finish = ({ next }: { next: IntakePick }) => {
    setPending(null);
    const period = periodOf({ when, timeZone });
    const found = next.kind === "PACKAGE" ? entry : null;
    if (!period || (next.kind === "PACKAGE" && !found)) return;
    if (next.kind === "ONE_OFF") onPick({ pick: next });
    const newKey = () => crypto.randomUUID();
    const custom = next.kind === "ONE_OFF" ? customLines({ period, newKey }) : [];
    onNext(completion({ review, pick: next, period, entry: found, newKey, customLines: custom }));
  };
  const ask = ({ next }: { next: IntakePick }) =>
    replacesLines({ review, pick: next }) > 0 ? setPending(next) : finish({ next });
  return {
    ready,
    next: () => (pick && ready ? ask({ next: pick }) : undefined),
    custom: () => ask({ next: CUSTOM }),
    replacing: pending ? replacesLines({ review, pick: pending }) : 0,
    confirm: () => (pending ? finish({ next: pending }) : undefined),
    cancel: () => setPending(null),
  };
}
