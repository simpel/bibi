import type { LayoutIssue } from "@bibi/core/schemas";
import { Badge, Button } from "@bibi/ui";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type LayoutSummaryProps = {
  seats: number | null;
  /** A typed capacity, shown next to the seats. */
  capacity: number | null;
  issues: readonly LayoutIssue[];
  onShowIssue: () => void;
  /** A short how-to shown next to the summary (the floor plan's wall editing). */
  hint?: string | null;
};

/** Seats and capacity bottom left; warnings as a button that steps through them. */
export function LayoutSummary({
  seats,
  capacity,
  issues,
  onShowIssue,
  hint = null,
}: LayoutSummaryProps) {
  const t = useTranslations("floorPlan.summary");
  return (
    <div className="absolute bottom-3 left-3 flex items-center gap-2 max-sm:top-3 max-sm:bottom-auto">
      {seats === null ? null : (
        <Badge variant="secondary" className="h-8 border bg-card px-3 text-sm shadow-sm">
          {capacity === null
            ? t("seats", { count: seats })
            : t("seatsAndCapacity", { count: seats, capacity })}
        </Badge>
      )}
      {issues.length > 0 ? (
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-warning bg-card text-foreground shadow-sm"
          onClick={onShowIssue}
        >
          <TriangleAlertIcon className="text-warning" />
          {t("warnings", { count: issues.length })}
        </Button>
      ) : null}
      {hint ? (
        <p className="rounded-md border bg-card px-3 py-1.5 text-muted-foreground text-sm shadow-sm">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
