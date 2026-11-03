import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { markMessageReadAction, markMessageUnreadAction } from "../actions";

/** Mark one inbox message read or unread for the team, with the shared toast flow, then refresh. */
export function useReadMessage() {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const setRead = ({ id, read }: { id: string; read: boolean }) =>
    run({
      action: () => (read ? markMessageReadAction({ id }) : markMessageUnreadAction({ id })),
      messages: { pending: common("saving"), success: read ? t("markedRead") : t("markedUnread") },
      onSuccess: () => router.refresh(),
    });
  return { setRead, pending };
}
