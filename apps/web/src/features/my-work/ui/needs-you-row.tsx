import type { MyWorkTaskGroup, NumberFormat } from "@bibi/core/schemas";
import { FeedItem } from "@bibi/ui";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { taskIcon } from "@/components/activity/subject-icons";
import { RelativeTime } from "@/components/relative-time";
import { taskHref } from "../lib/task-href";
import type { MyWorkTaskWireish } from "./my-work-wireish";
import { useTaskText } from "./use-task-text";

export type NeedsYouRowProps = {
  task: MyWorkTaskWireish;
  numbers: NumberFormat;
  /** Just dismissed: shown greyed out until the next page. */
  dimmed?: boolean;
  /** A hover button over the end of the row, e.g. dismiss. */
  action?: ReactNode;
};

/** How urgent the group is: red when blocked or late, amber when due today or soon. */
export function toneOf({ group }: { group: MyWorkTaskGroup }) {
  if (group === "BLOCKED" || group === "LATE") return "destructive";
  return group === "TODAY" || group === "SOON" ? "warning" : "default";
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
