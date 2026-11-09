import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { NotificationLike } from "../lib/notification-like";

/**
 * A notification's sentence and its order line, from the snapshot it carries (ADR 0094): what
 * happened, and `#12 Title` of the order at the time.
 */
export function useNotificationText() {
  const t = useTranslations("notifications");
  const numbers = useNumberFormat();
  return ({ notification }: { notification: NotificationLike }) => {
    const { data } = notification;
    const reference = data.orderReference ?? "";
    const key = data.overpaid ? "PAYMENT_OVERPAID" : notification.kind;
    const message = t(`messages.${key}`, {
      actor: data.actorName ?? t("someone"),
      reference,
      runSheet: data.runSheetName ?? t("aRunSheet"),
      version: data.runSheetVersion ?? 1,
      from: data.fromStatus ?? t("noStatus"),
      to: data.toStatus ?? t("noStatus"),
      amount:
        data.amountMinor === undefined
          ? ""
          : numbers.money({ minor: data.amountMinor, currency: data.currency ?? null }),
    });
    const order = `#${reference} ${data.orderTitle || t("untitled")}`;
    return { message, order };
  };
}
