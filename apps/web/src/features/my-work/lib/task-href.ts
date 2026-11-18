import { INBOX_ROUTE } from "@/lib/inbox-routes";
import { orderRoute, quoteRoute, ROUTES } from "@/lib/routes";
import type { MyWorkTaskWireish } from "../ui/my-work-wireish";

type TaskHrefInput = { task: MyWorkTaskWireish };

/** Where a task's row takes the member to act (spec: home, "Needs you"). */
export function taskHref({ task }: TaskHrefInput): string {
  if (task.runSheetId) return `${ROUTES.runSheets}/${encodeURIComponent(task.runSheetId)}`;
  if (task.quoteId) return quoteRoute({ id: task.quoteId });
  if (task.kind === "UNREAD_MESSAGES") return INBOX_ROUTE;
  return orderRoute({ id: task.orderId });
}
