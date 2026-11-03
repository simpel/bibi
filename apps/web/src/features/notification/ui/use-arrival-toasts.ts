import type { NotificationWire } from "@bibi/core/schemas";
import { toast } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { inboxMessageRoute } from "@/lib/inbox-routes";
import { useRouter } from "@/lib/navigation";
import { notificationHref } from "../lib/notification-href";
import type { ArrivedMessage } from "./use-notification-stream";
import { useNotificationText } from "./use-notification-text";

/** Toasts stay short: longer text ends in an ellipsis. */
const MAX_TEXT = 120;

const truncate = ({ text }: { text: string }) =>
  text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1).trimEnd()}…` : text;

/**
 * Only the tab in front toasts: the stream reaches every tab of the browser (one connection,
 * relayed), and the same arrival should not stack up behind the others.
 */
const inFront = () => typeof document !== "undefined" && document.visibilityState === "visible";

/** Toasts for what just came in: a notification for the member, a message in the inbox. */
export function useArrivalToasts() {
  const t = useTranslations("notifications");
  const inbox = useTranslations("inbox");
  const router = useRouter();
  const textOf = useNotificationText();
  const notification = ({ notification: arrived }: { notification: NotificationWire }) => {
    if (!inFront()) return;
    const { message } = textOf({ notification: arrived });
    const href = notificationHref({ notification: arrived });
    toast(t("arrivedTitle"), {
      description: truncate({ text: message }),
      action: { label: t("arrivedOpen"), onClick: () => router.push(href) },
    });
  };
  const message = ({ id, subject, sender }: ArrivedMessage) => {
    if (!inFront()) return;
    toast(inbox("arrivedTitle"), {
      description: truncate({
        text: [sender ?? inbox("unknownSender"), subject ?? inbox("noSubject")].join(": "),
      }),
      action: {
        label: inbox("arrivedOpen"),
        onClick: () => router.push(inboxMessageRoute({ id })),
      },
    });
  };
  return { notification, message };
}
