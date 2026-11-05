import {
  type DateTimeFormat,
  deriveRunSheetStatus,
  type RunSheetDto,
  type RunSheetStatus as RunSheetStatusEnum,
} from "@bibi/core/schemas";
import { Badge, type BadgeProps } from "@bibi/ui";
import { useTranslations } from "next-intl";

/** A run sheet as the server (Date) or a tool result (ISO string) carries it. */
export type RunSheetStatusValue = Pick<
  RunSheetDto,
  "version" | "baseVersion" | "changes" | "blocked"
> & {
  publishedAt?: Date | string | null;
  fulfilledAt?: Date | string | null;
  sentAt?: Date | string | null;
};

export type RunSheetStatusProps = {
  runSheet: RunSheetStatusValue;
  /** The viewer's date and time format: `getDateTimeFormat()` on the server, the hook in a client card. */
  dates: DateTimeFormat;
};

const BADGE_VARIANTS: Record<RunSheetStatusEnum, BadgeProps["variant"]> = {
  DRAFT: "secondary",
  BLOCKED: "destructive",
  PENDING: "outline",
  REVISION_PENDING: "warning",
  FULFILLED: "success",
};

/**
 * Operational status badge (Draft, Blocked, Pending, Revision pending, Fulfilled),
 * version and timestamps.
 */
export function RunSheetStatus({ runSheet, dates: format }: RunSheetStatusProps) {
  const t = useTranslations("runSheet");
  const rawPublished = runSheet.publishedAt ?? runSheet.sentAt;
  const published = rawPublished ? new Date(rawPublished) : null;
  const fulfilled = runSheet.fulfilledAt ? new Date(runSheet.fulfilledAt) : null;
  const status = deriveRunSheetStatus({
    blocked: runSheet.blocked,
    publishedAt: published,
    baseVersion: runSheet.baseVersion,
    fulfilledAt: fulfilled,
  });

  return (
    <div data-slot="run-sheet-status" className="flex flex-wrap items-center gap-2 text-sm">
      <Badge variant={BADGE_VARIANTS[status]}>
        {t(`status.${status.toLowerCase()}` as Parameters<typeof t>[0])}
      </Badge>
      <Badge variant="outline" className="tabular-nums">
        {t("version", { version: runSheet.version })}
      </Badge>
      {fulfilled ? (
        <span className="text-muted-foreground text-xs">
          {t("fulfilledAt", { when: format.dateTime({ instant: fulfilled }) })}
        </span>
      ) : published ? (
        <span className="text-muted-foreground text-xs">
          {t("publishedAt", { when: format.dateTime({ instant: published }) })}
        </span>
      ) : null}
      {runSheet.baseVersion !== null ? (
        <span className="text-muted-foreground text-xs">
          {t("changes", { count: runSheet.changes.length, version: runSheet.baseVersion })}
        </span>
      ) : null}
    </div>
  );
}
