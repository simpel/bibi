import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { markMessagesAction } from "../actions";

/** Mark inbox messages read or unread for the team, with the shared toast flow, then refresh. */
export function useReadMessage() {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const setRead = ({ ids, read }: { ids: string[]; read: boolean }) =>
    run({
      action: () => markMessagesAction({ ids, read }),
      messages: {
        pending: common("saving"),
        success: t(read ? "markedRead" : "markedUnread", { count: ids.length }),
      },
      onSuccess: () => router.refresh(),
    });
  return { setRead, pending };
}
