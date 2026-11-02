import { type LineIssue, lineIssues } from "@bibi/core";
import type { DateTimeFormat } from "@bibi/core/schemas";
import { Alert, AlertDescription, AlertTitle } from "@bibi/ui";
import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getDateTimeFormat } from "@/server/date-time-format";
import { runOperation } from "@/server/run-operation";
import { OpenChoiceAlerts } from "./open-choice-alerts";

type Shown = { key: string; issue: LineIssue; line: string; other: string };

type AlertKey =
  | "hardClash"
  | "blocked"
  | "softOverlap"
  | "selfOverlap"
  | "setupCapacity"
  | "poolShort"
  | "outsideHours";

type Message = { key: AlertKey; values: Record<string, string | number> };

type MessageInput = { shown: Shown; format: DateTimeFormat };

/** The alert's message key and its values (ADR 0081 issue kinds). */
function messageOf({ shown: { issue, line, other }, format }: MessageInput): Message {
  const period =
    issue.startsAt && issue.endsAt
      ? format.dateTimeRange({ start: issue.startsAt, end: issue.endsAt })
      : "";
  // The holding ticket by its title, else its reference.
  const ticket = issue.ticketTitle ?? `#${issue.ticketReference ?? 0}`;
  switch (issue.kind) {
    case "HARD_CLASH":
      return issue.ticketReference === null
        ? { key: "blocked", values: { line, period } }
        : { key: "hardClash", values: { line, ticket, period } };
    case "SOFT_OVERLAP":
      return { key: "softOverlap", values: { line, ticket, period } };
    case "SELF_OVERLAP":
      return { key: "selfOverlap", values: { line, other } };
    case "SETUP_CAPACITY":
      return { key: "setupCapacity", values: { line, capacity: issue.capacity ?? 0 } };
    case "POOL_SHORT":
      return {
        key: "poolShort",
        values: { line, needed: issue.needed ?? 0, free: issue.free ?? 0 },
      };
    case "OUTSIDE_HOURS":
      return { key: "outsideHours", values: { line } };
  }
}

/** One alert per issue; an overlap of two lines is one issue, shown once. */
function shownIssues({
  lines,
}: {
  lines: { lineId: string; name: string; issues: LineIssue[] }[];
}) {
  const names = new Map(lines.map((line) => [line.lineId, line.name]));
  const seen = new Set<string>();
  return lines.flatMap(({ lineId, name, issues }) =>
    issues.flatMap((issue, index): Shown[] => {
      const pair = issue.otherLineId ? [lineId, issue.otherLineId].sort().join(" ") : null;
      if (pair && seen.has(pair)) return [];
      if (pair) seen.add(pair);
      const other = issue.otherLineId ? (names.get(issue.otherLineId) ?? "") : "";
      return [{ key: `${lineId}-${index}`, issue, line: name, other }];
    }),
  );
}

export type TicketIssuesProps = { ticketId: string };

/**
 * What stands in the way of the ticket's lines now (`line.issues`), one alert per issue at the
 * top of the ticket page, after any required choice still open (ADR 0089): a hard clash or block
 * is destructive, the rest warn. The block collapses when there is nothing to show.
 */
export async function TicketIssues({ ticketId }: TicketIssuesProps) {
  const [result, t, format] = await Promise.all([
    runOperation({ operation: lineIssues, input: { ticketId } }),
    getTranslations("line.issueAlerts"),
    getDateTimeFormat(),
  ]);
  const lines = result.ok ? result.value.lines : [];
  return (
    <div data-slot="ticket-issues" className="grid gap-2 empty:hidden">
      <OpenChoiceAlerts ticketId={ticketId} />
      {shownIssues({ lines }).map((shown) => {
        const { key, values } = messageOf({ shown, format });
        const hard = shown.issue.kind === "HARD_CLASH";
        const Icon = hard ? CircleAlertIcon : TriangleAlertIcon;
        return (
          <Alert key={shown.key} variant={hard ? "destructive" : "warning"}>
            <Icon />
            <AlertTitle>{t(`${key}.title`)}</AlertTitle>
            <AlertDescription>{t(`${key}.description`, values)}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
