"use client";

import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useAuthFormAction } from "./use-auth-form-action";

export type UseInvitationActionsInput = { invitationId: string };

/** Accept / decline calls for one invitation, one toast each, navigation on success. */
export function useInvitationActions({ invitationId }: UseInvitationActionsInput) {
  const t = useTranslations("auth");
  const router = useRouter();
  const { pending, run } = useAuthFormAction();
  const accept = () =>
    run({
      call: () => authClient.organization.acceptInvitation({ invitationId }),
      messages: { pending: t("acceptingInvitation"), success: t("invitationAccepted") },
      onSuccess: () => {
        router.replace(ROUTES.home);
        router.refresh();
      },
    });
  const decline = () =>
    run({
      call: () => authClient.organization.rejectInvitation({ invitationId }),
      messages: { pending: t("decliningInvitation"), success: t("invitationDeclined") },
      onSuccess: () => {
        router.replace(ROUTES.home);
      },
    });
  return { pending, accept, decline };
}
