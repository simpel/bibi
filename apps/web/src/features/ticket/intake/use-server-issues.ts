import type { AppErrorIssue } from "@bibi/core";
import { useState } from "react";
import type { IntakeReview } from "./review-state";

type Kept = { issues: AppErrorIssue[]; stamp: string };

const stampOf = ({ review }: { review: IntakeReview }) => JSON.stringify(review);

/**
 * Create's server issues that name no field of the form (`lines.1.options`), kept until the
 * review changes: a line or any of the form's values (the form syncs into the review).
 */
export function useServerIssues({ review }: { review: IntakeReview }) {
  const [kept, setKept] = useState<Kept | null>(null);
  const issues = kept && kept.stamp === stampOf({ review }) ? kept.issues : [];
  const keep = ({ issues: next }: { issues: AppErrorIssue[] }) =>
    setKept({ issues: next, stamp: stampOf({ review }) });
  return { issues, keep };
}
