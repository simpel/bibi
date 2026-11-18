import { ClockIcon, OctagonAlertIcon, TriangleAlertIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { Badge } from "../badge/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip/tooltip";
import type { CardIssue } from "./booking-tone";

export type IssueBadgeProps = {
  issue: CardIssue;
  className?: string;
  /** Only the icon, for tight places (a compact card's header); the words move into the tooltip. */
  iconOnly?: boolean;
};

/** An issue in words: red with a stop sign when it blocks, amber with a triangle to fix. */
export function IssueBadge({ issue, className, iconOnly }: IssueBadgeProps) {
  const error = issue.level === "error";
  const Icon = error ? OctagonAlertIcon : issue.icon === "clock" ? ClockIcon : TriangleAlertIcon;
  const badge = (
    <Badge
      variant={error ? "destructive" : "warning"}
      className={cn(
        "min-w-0 max-w-full gap-1",
        (issue.detail || iconOnly) && "cursor-help",
        iconOnly && "px-1",
        className,
      )}
      {...(issue.detail || iconOnly ? { tabIndex: 0 } : {})}
      {...(iconOnly ? { "aria-label": issue.label } : {})}
    >
      <Icon aria-hidden className="size-3 shrink-0" />
      {iconOnly ? null : <span className="truncate">{issue.label}</span>}
    </Badge>
  );
  if (!issue.detail && !iconOnly) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-64">
        {iconOnly ? [issue.label, issue.detail].filter(Boolean).join(". ") : issue.detail}
      </TooltipContent>
    </Tooltip>
  );
}
