import type { NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { MyWorkTaskWireish } from "./my-work-wireish";

type TaskTextInput = { task: MyWorkTaskWireish; numbers: NumberFormat };

/** What the task asks, as a sentence that starts with the verb (Needs you and the order page). */
export function useTaskText({ task, numbers }: TaskTextInput): string {
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
