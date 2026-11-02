import type { PlanLineIssue, PreviewLine } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";

/** How a line's availability shows: ✓, ⚠ (warnings) or ✕ (a hard clash). */
export type LineTone = "ok" | "warn" | "clash" | "unknown";

/** The tone of a planned line; null (no preview yet) is unknown. */
export function lineTone({
  planned,
}: {
  planned: Pick<PreviewLine, "issues"> | null | undefined;
}): LineTone {
  if (!planned) return "unknown";
  if (planned.issues.some(({ kind }) => kind === "HARD_CLASH")) return "clash";
  return planned.issues.length > 0 ? "warn" : "ok";
}

export const TONE_CLASS: Record<LineTone, string> = {
  ok: "text-success",
  warn: "text-warning-foreground",
  clash: "text-destructive",
  unknown: "text-muted-foreground",
};

/** One issue of a planned line in the user's words (spec "Lines table", "Availability box"). */
export function useIssueText() {
  const t = useTranslations("ticketIntake.issues");
  const dates = useDateTimeFormat();
  return ({ issue }: { issue: PlanLineIssue }): string => {
    const period =
      issue.startsAt && issue.endsAt
        ? dates.timeRange({ start: issue.startsAt, end: issue.endsAt })
        : "";
    // The holding ticket by its title, else its reference.
    const ticket = issue.ticketTitle ?? `#${issue.ticketReference ?? 0}`;
    switch (issue.kind) {
      case "HARD_CLASH":
        return issue.ticketReference === null
          ? t("blocked", { period })
          : t("hardClash", { ticket, period });
      case "SOFT_OVERLAP":
        return t("softOverlap", { ticket, period });
      case "SELF_OVERLAP":
        return t("selfOverlap", { line: (issue.otherLineIndex ?? 0) + 1 });
      case "SETUP_CAPACITY":
        return t("setupCapacity", { capacity: issue.capacity ?? 0 });
      case "POOL_SHORT":
        return t("poolShort", { needed: issue.needed ?? 0, free: issue.free ?? 0 });
      case "OUTSIDE_HOURS":
        return t("outsideHours");
    }
  };
}
