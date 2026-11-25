import { Avatar, CompactCardHeader, IssueBadge, PinAction, StatusBadge } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useFlagIssues } from "@/features/my-work/ui/my-work-flag";
import { useTentativeIssue } from "@/features/my-work/ui/use-tentative-issue";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { boardCardPin } from "../lib/board-card-pin";
import { isTentative } from "../lib/board-card-surface";
import type { BoardCard } from "../lib/kanban-model";
import { NextTaskChip } from "./next-task-chip";

export type PipelineCardContentProps = {
  /** `customerName` is null when the caller may not view customers: then none is shown. */
  card: BoardCard;
};

/** A deal that has sat in its status this many days says so: it may be going stale. */
const STALE_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days since the order entered its status. */
const daysSince = ({ instant }: { instant: Date | string }) =>
  Math.floor((Date.now() - new Date(instant).getTime()) / DAY_MS);

/** The second line: customer and date, as short as the column needs. */
function useSubtitle({ card }: { card: BoardCard }) {
  const t = useTranslations("pipeline");
  const dates = useDateTimeFormat();
  return [card.customerName, card.startsAt ? dates.date({ instant: card.startsAt }) : t("noDate")]
    .filter(Boolean)
    .join(" · ");
}

/** The agreed value (accepted quote), else the estimate; null without either. */
function useValue({ card }: { card: BoardCard }) {
  const { money } = useNumberFormat();
  const minor = card.confirmedValueMinor ?? card.estimatedValueMinor;
  return minor === null ? null : money({ minor, currency: card.currency });
}

/**
 * A board card: the same small card as a minimized pinned card (`CompactCardHeader`), with the
 * My work cues (spec: home, Tone): its flags as red and amber icons beside the pin (the words in
 * their tooltip), the pin that puts it in the tray, and the red or amber edge. A click anywhere else opens the order (`KanbanBoard`'s `onOpenCard`).
 * The order's next open task follows as an outlined chip (ADR 0117). The bottom row never shortens: the value, the status in a column that groups several, how long
 * a stale deal has sat, and the assignee.
 */
export function PipelineCardContent({ card }: PipelineCardContentProps) {
  const t = useTranslations("pipeline");
  const dates = useDateTimeFormat();
  const timeZone = useOrganizationTimeZone();
  const subtitle = useSubtitle({ card });
  const value = useValue({ card });
  const flagged = useFlagIssues({ flags: card.flags, timeZone, dates });
  const tentativeIssue = useTentativeIssue();
  const issues = isTentative({ card }) ? [...flagged, tentativeIssue] : flagged;
  const days = daysSince({ instant: card.statusChangedAt });
  const stale = days >= STALE_DAYS;
  const hasFooter = Boolean(value || card.statusTitle || stale || card.assigneeName);
  return (
    <div className="grid min-w-0 gap-2">
      <CompactCardHeader
        title={card.title}
        subtitle={subtitle}
        actionsInset={issues.length > 0 ? "pr-24" : "pr-16"}
        actions={
          <>
            {issues.map((issue) => (
              <IssueBadge key={issue.key} issue={issue} iconOnly />
            ))}
            <PinAction
              booking={boardCardPin({ card, timeZone, issues: flagged })}
              name={card.title}
            />
          </>
        }
      />
      {card.nextTask ? <NextTaskChip task={card.nextTask} className="flex min-w-0" /> : null}
      {hasFooter ? (
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          {value ? (
            <span className="font-medium text-foreground text-xs tabular-nums">{value}</span>
          ) : null}
          {card.statusTitle ? (
            <StatusBadge tinted label={card.statusTitle} color={card.statusColor} />
          ) : null}
          {stale ? <span>{t("daysInStatus", { count: days })}</span> : null}
          {card.assigneeName ? (
            <Avatar
              name={card.assigneeName}
              size="xs"
              className="ml-auto"
              title={card.assigneeName}
              aria-label={card.assigneeName}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
