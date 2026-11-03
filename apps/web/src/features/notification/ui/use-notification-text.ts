import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/lib/number/use-number-format";
import type { NotificationLike } from "../lib/notification-like";

/**
 * A notification's sentence and its ticket line, from the snapshot it carries (ADR 0094): what
 * happened, and `#12 Title` of the ticket at the time.
 */
export function useNotificationText() {
  const t = useTranslations("notifications");
  const numbers = useNumberFormat();
  return ({ notification }: { notification: NotificationLike }) => {
    const { data } = notification;
    const reference = data.ticketReference ?? "";
    const message = t(`messages.${notification.kind}`, {
      actor: data.actorName ?? t("someone"),
      reference,
      workOrder: data.workOrderName ?? t("aWorkOrder"),
      version: data.workOrderVersion ?? 1,
      from: data.fromStatus ?? t("noStatus"),
      to: data.toStatus ?? t("noStatus"),
      amount:
        data.amountMinor === undefined
          ? ""
          : numbers.money({ minor: data.amountMinor, currency: data.currency ?? null }),
    });
    const ticket = `#${reference} ${data.ticketTitle || t("untitled")}`;
    return { message, ticket };
  };
}
