"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";
import { useAuthSubmit } from "./use-auth-submit";

export type UseInvitationActionsInput = { invitationId: string };

/** Accept / decline calls for one invitation, with toasts and navigation on success. */
export function useInvitationActions({ invitationId }: UseInvitationActionsInput) {
  const t = useTranslations("auth");
  const router = useRouter();
  const { pending, errorKey, run } = useAuthSubmit();
  const accept = () =>
    run({
      call: () => authClient.organization.acceptInvitation({ invitationId }),
      onSuccess: () => {
        toast.success(t("invitationAccepted"));
        router.replace(ROUTES.venues);
        router.refresh();
      },
    });
  const decline = () =>
    run({
      call: () => authClient.organization.rejectInvitation({ invitationId }),
      onSuccess: () => {
        toast.success(t("invitationDeclined"));
        router.replace(ROUTES.venues);
      },
    });
  return { pending, errorKey, accept, decline };
}
