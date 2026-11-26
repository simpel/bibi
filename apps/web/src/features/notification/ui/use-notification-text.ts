import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { NotificationLike } from "../lib/notification-like";

/** The sentence of a comment notification (ADR 0115): mentioned, replied or added, on a line. */
function commentKey({ notification }: { notification: NotificationLike }) {
  const { kind, data } = notification;
  if (kind === "ASSIGNED" && notification.taskId) return "ASSIGNED_TASK";
  if (kind === "COMMENT_MENTIONED") return data.lineName ? "COMMENT_MENTIONED_LINE" : kind;
  if (kind !== "COMMENT_ADDED") return kind;
  if (data.reply) return data.lineName ? "COMMENT_REPLIED_LINE" : "COMMENT_REPLIED";
  return data.lineName ? "COMMENT_ADDED_LINE" : kind;
}

/**
 * A notification's sentence and its order line, from the snapshot it carries (ADR 0094): what
 * happened, and `#12 Title` of the order at the time, or a task's type and time (ADR 0117).
 */
export function useNotificationText() {
  const t = useTranslations("notifications");
  const numbers = useNumberFormat();
  const dates = useDateTimeFormat();
  return ({ notification }: { notification: NotificationLike }) => {
    const { data } = notification;
    const reference = data.orderReference ?? "";
    const key = data.overpaid ? "PAYMENT_OVERPAID" : commentKey({ notification });
    const task = data.taskTypeName ?? "";
    const message = t(`messages.${key}`, {
      actor: data.actorName ?? t("someone"),
      task,
      reference,
      runSheet: data.runSheetName ?? t("aRunSheet"),
      version: data.runSheetVersion ?? 1,
      from: data.fromStatus ?? t("noStatus"),
      to: data.toStatus ?? t("noStatus"),
      line: data.lineName ?? "",
      excerpt: data.excerpt ?? "",
      amount:
        data.amountMinor === undefined
          ? ""
          : numbers.money({ minor: data.amountMinor, currency: data.currency ?? null }),
    });
    if (notification.taskId && !notification.orderId) {
      const at = data.taskDueAt ? dates.dateTime({ instant: data.taskDueAt }) : null;
      return { message, order: [task, at].filter(Boolean).join(" · ") };
    }
    const order = `#${reference} ${data.orderTitle || t("untitled")}`;
    return { message, order };
  };
}
