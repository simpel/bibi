import type { NumberFormat } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { RelativeTime } from "@/components/relative-time";
import { Link } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import { taskAction, taskHref } from "../lib/task-href";
import type { MyWorkTaskWireish } from "./my-work-wireish";

export type NeedsYouRowProps = { task: MyWorkTaskWireish; numbers: NumberFormat };

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

/** One task: the sentence, the order it is on, when it is due and the button to act. */
export function NeedsYouRow({ task, numbers }: NeedsYouRowProps) {
  const t = useTranslations("myWork.needsYou");
  const text = useTaskText({ task, numbers });
  const order = [`#${task.reference}`, task.title, task.customerName].filter(Boolean).join(" · ");
  return (
    <li
      data-slot="needs-you-row"
      data-kind={task.kind}
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
    >
      <div className="grid min-w-0 flex-1 gap-0.5">
        <Link
          href={orderRoute({ id: task.orderId })}
          className="truncate text-sm font-medium hover:underline"
        >
          {text}
        </Link>
        <p className="flex min-w-0 gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{order}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">
            {t(task.group === "WAITING" ? "since" : "due")} <RelativeTime instant={task.dueAt} />
          </span>
        </p>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link href={taskHref({ task })}>{t(`actions.${taskAction({ task })}`)}</Link>
      </Button>
    </li>
  );
}
