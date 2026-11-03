import { toast } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { inboxMessageRoute } from "@/lib/inbox-routes";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { ArrivedMessage } from "./use-notification-stream";

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
  const notification = () => {
    if (!inFront()) return;
    toast(t("arrivedTitle"), {
      action: { label: t("arrivedOpen"), onClick: () => router.push(ROUTES.notifications) },
    });
  };
  const message = ({ id, subject, sender }: ArrivedMessage) => {
    if (!inFront()) return;
    toast(inbox("arrivedTitle"), {
      description: [sender ?? inbox("unknownSender"), subject ?? inbox("noSubject")].join(": "),
      action: {
        label: inbox("arrivedOpen"),
        onClick: () => router.push(inboxMessageRoute({ id })),
      },
    });
  };
  return { notification, message };
}
