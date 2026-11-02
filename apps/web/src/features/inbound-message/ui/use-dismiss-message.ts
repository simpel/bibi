import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { dismissMessageAction, restoreMessageAction } from "../actions";

/** Dismiss or restore one inbox message with the shared toast flow, then refresh the page. */
export function useDismissMessage() {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const toggle = ({ id, dismissed }: { id: string; dismissed: boolean }) =>
    run({
      action: () => (dismissed ? restoreMessageAction({ id }) : dismissMessageAction({ id })),
      messages: { pending: common("saving"), success: dismissed ? t("restored") : t("dismissed") },
      onSuccess: () => router.refresh(),
    });
  return { toggle, pending };
}
