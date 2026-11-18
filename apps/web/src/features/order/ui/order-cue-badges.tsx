import type { MyWorkFlag } from "@bibi/core/schemas";
import { IssueBadge } from "@bibi/ui";
import { useFlagIssues } from "@/features/my-work/ui/my-work-flag";
import { useTentativeIssue } from "@/features/my-work/ui/use-tentative-issue";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";

export type OrderCueBadgesProps = {
  flags: readonly MyWorkFlag[];
  /** Every held line is preliminary: the amber clock badge. */
  tentative: boolean;
};

/** An order's flags, and preliminary, as the red and amber badges of the pipeline card, after its title. */
export function OrderCueBadges({ flags, tentative }: OrderCueBadgesProps) {
  const dates = useDateTimeFormat();
  const timeZone = useOrganizationTimeZone();
  const flagged = useFlagIssues({ flags, timeZone, dates });
  const tentativeIssue = useTentativeIssue();
  const issues = tentative ? [...flagged, tentativeIssue] : flagged;
  if (issues.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {issues.map((issue) => (
        <IssueBadge key={issue.key} issue={issue} className="text-[10px]" />
      ))}
    </span>
  );
}
