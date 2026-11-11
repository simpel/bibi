import { BLOCKING_ISSUE_KINDS, type LayoutIssue } from "@bibi/core/schemas";
import { Badge, Button } from "@bibi/ui";
import { OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type LayoutSummaryProps = {
  seats: number | null;
  /** A typed capacity, shown next to the seats. */
  capacity: number | null;
  /** The room's people limit, if any. */
  maxPeople: number | null;
  issues: readonly LayoutIssue[];
  onShowIssue: () => void;
  /** A short how-to shown next to the summary (the floor plan's wall editing). */
  hint?: string | null;
};

/**
 * Seats and capacity bottom left, the room's people limit, and the problems: hard limits in the
 * destructive colour (Save is refused until fixed), warnings as a button that steps through them.
 */
export function LayoutSummary({
  seats,
  capacity,
  maxPeople,
  issues,
  onShowIssue,
  hint = null,
}: LayoutSummaryProps) {
  const t = useTranslations("floorPlan.summary");
  const blocking = issues.filter((issue) => BLOCKING_ISSUE_KINDS.includes(issue.kind));
  const warnings = issues.length - blocking.length;
  return (
    <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 max-sm:top-3 max-sm:bottom-auto">
      {seats === null ? null : (
        <Badge variant="secondary" className="h-8 border bg-card px-3 text-sm shadow-sm">
          {capacity === null
            ? t("seats", { count: seats })
            : t("seatsAndCapacity", { count: seats, capacity })}
        </Badge>
      )}
      {maxPeople === null || seats === null ? null : (
        <Badge variant="secondary" className="h-8 border bg-card px-3 text-sm shadow-sm">
          {t("limit", { max: maxPeople })}
        </Badge>
      )}
      {warnings > 0 ? (
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-warning bg-card text-foreground shadow-sm"
          onClick={onShowIssue}
        >
          <TriangleAlertIcon className="text-warning" />
          {t("warnings", { count: warnings })}
        </Button>
      ) : null}
      {blocking.map((issue) => (
        <Button
          key={issue.kind}
          variant="outline"
          size="sm"
          className="h-auto rounded-md border-destructive bg-card py-1.5 text-left whitespace-normal text-destructive shadow-sm"
          onClick={onShowIssue}
        >
          <OctagonXIcon />
          {issue.kind === "EXIT_BLOCKED"
            ? t("exitBlocked", { count: issue.elementIds.length })
            : t("overLimit", { capacity: capacity ?? seats ?? 0, max: maxPeople ?? 0 })}
        </Button>
      ))}
      {hint ? (
        <p className="rounded-md border bg-card px-3 py-1.5 text-muted-foreground text-sm shadow-sm">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
