import type { MyWorkTaskGroup, NumberFormat } from "@bibi/core/schemas";
import { FeedItem } from "@bibi/ui";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { taskIcon } from "@/components/activity/subject-icons";
import { RelativeTime } from "@/components/relative-time";
import { taskHref } from "../lib/task-href";
import type { MyWorkTaskWireish } from "./my-work-wireish";

export type NeedsYouRowProps = {
  task: MyWorkTaskWireish;
  numbers: NumberFormat;
  /** Just dismissed: shown greyed out until the next page. */
  dimmed?: boolean;
  /** A hover button over the end of the row, e.g. dismiss. */
  action?: ReactNode;
};

/** What the task asks, as a sentence that starts with the verb. */
function useTaskText({ task, numbers }: NeedsYouRowProps): string {
  const t = useTranslations("myWork.needsYou.tasks");
  const line = task.lineName ?? "";
  const runSheet = task.runSheetName ?? "";
  const count = task.count ?? 0;
  switch (task.kind) {
    case "HARD_CLASH":
      return task.otherReference === null
        ? t("HARD_CLASH_BLOCK", { line })
        : t("HARD_CLASH", { line, reference: task.otherReference });
    case "LINE_ISSUE":
      return t(`LINE_ISSUE.${task.issueKind ?? "SELF_OVERLAP"}`, { line });
    case "RUN_SHEET_BLOCKED":
    case "RUN_SHEET_UNSENT":
      return t(task.kind, { runSheet });
    case "UNCONFIRMED":
    case "UNREAD_MESSAGES":
      return t(task.kind, { count });
    case "PAYMENT_OVERDUE":
      return t(task.kind, { amount: numbers.money({ minor: task.amountMinor ?? 0 }) });
    default:
      return t(task.kind);
  }
}

/** How urgent the group is: red when blocked or late. */
function toneOf({ group }: { group: MyWorkTaskGroup }) {
  return group === "BLOCKED" || group === "LATE" ? "destructive" : "default";
}

/**
 * One task, shaped like a notification: its kind's icon (a red warning triangle when late), the
 * sentence, the order and when it is due. The row opens where the member acts (the run sheet,
 * the quote, the inbox or the order).
 */
export function NeedsYouRow({ task, numbers, dimmed = false, action }: NeedsYouRowProps) {
  const t = useTranslations("myWork.needsYou");
  const order = [`#${task.reference}`, task.title, task.customerName].filter(Boolean).join(" · ");
  return (
    <li data-slot="needs-you-row" data-kind={task.kind}>
      <FeedItem
        icon={task.group === "LATE" ? TriangleAlertIcon : taskIcon({ kind: task.kind })}
        tone={toneOf({ group: task.group })}
        href={taskHref({ task })}
        title={useTaskText({ task, numbers })}
        emphasis={!dimmed && task.group !== "WAITING"}
        muted={dimmed}
        action={dimmed ? undefined : action}
        meta={
          <>
            <span className="truncate">{order}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0">
              {t(task.group === "WAITING" ? "since" : "due")} <RelativeTime instant={task.dueAt} />
            </span>
          </>
        }
      />
    </li>
  );
}
