import type { MyWorkTask, MyWorkTaskKind, NumberFormat } from "@bibi/core/schemas";
import { Alert, AlertDescription, AlertTitle, Button } from "@bibi/ui";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { taskIcon } from "@/components/activity/subject-icons";
import { RelativeTime } from "@/components/relative-time";
import { Link } from "@/lib/navigation";
import { getNumberFormat } from "@/server/number-format";
import { taskHref } from "../lib/task-href";
import { loadNeedsYou } from "../load-needs-you";
import { toneOf } from "./needs-you-row";
import { useTaskText } from "./use-task-text";

/** Line issues already have their own alerts on the order page (`OrderIssues`). */
type ShownElsewhere = "HARD_CLASH" | "LINE_ISSUE";
type OrderTask = MyWorkTask & { kind: Exclude<MyWorkTaskKind, ShownElsewhere> };

type OpenKey = "runSheet" | "quote" | "inbox" | "task";

/** Where the task is done when that is not this page: the link the alert offers. */
function openKeyOf({ task }: { task: MyWorkTask }): OpenKey | null {
  if (task.runSheetId) return "runSheet";
  if (task.quoteId) return "quote";
  if (task.taskId) return "task";
  return task.kind === "UNREAD_MESSAGES" ? "inbox" : null;
}

type OrderTaskAlertProps = { task: OrderTask; numbers: NumberFormat };

/** One task as an alert: what to do and when it is due, with a button to where it is done. */
function OrderTaskAlert({ task, numbers }: OrderTaskAlertProps) {
  const t = useTranslations("myWork");
  const Icon = task.group === "LATE" ? TriangleAlertIcon : taskIcon({ kind: task.kind });
  const open = openKeyOf({ task });
  return (
    <Alert variant={toneOf({ group: task.group })} data-kind={task.kind}>
      <Icon />
      {/* Title and due date on the left, the way to do it as a button at the top right. */}
      <div className="col-start-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1">
          <AlertTitle className="col-start-1 line-clamp-none">
            {useTaskText({ task, numbers })}
          </AlertTitle>
          <p className="text-sm font-medium">
            {t(task.group === "WAITING" ? "needsYou.since" : "needsYou.due")}{" "}
            <RelativeTime instant={task.dueAt} />
          </p>
          <AlertDescription className="col-start-1">
            <p>{t(`orderTasks.hints.${task.kind}`)}</p>
          </AlertDescription>
        </div>
        {open ? (
          <Button asChild size="sm" variant="outline" className="shrink-0 self-start">
            <Link href={taskHref({ task })}>{t(`orderTasks.open.${open}`)}</Link>
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}

export type OrderTasksProps = { orderId: string };

/**
 * The caller's Needs you tasks on this order (spec: home), one alert each at the top of the order
 * page, so a task opened from the notification panel says here what to do. It reuses the shell's
 * read of Needs you; line issues are left to their own alerts. Nothing shows without tasks.
 */
export async function OrderTasks({ orderId }: OrderTasksProps) {
  const [tasks, numbers] = await Promise.all([loadNeedsYou(), getNumberFormat()]);
  const shown = (tasks ?? []).filter(
    (task): task is OrderTask =>
      task.orderId === orderId && task.kind !== "HARD_CLASH" && task.kind !== "LINE_ISSUE",
  );
  if (shown.length === 0) return null;
  return (
    <div data-slot="order-tasks" className="grid gap-2">
      {shown.map((task) => (
        <OrderTaskAlert key={task.key} task={task} numbers={numbers} />
      ))}
    </div>
  );
}
