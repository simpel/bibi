"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useAuthFormAction } from "@/features/auth/ui/use-auth-form-action";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";

/** Join through a pending invitation (Better Auth), staying on the list (ADR 0076). */
export function AcceptInvitationButton({
  invitationId,
  name,
}: {
  invitationId: string;
  name: string;
}) {
  const t = useTranslations("welcome.join");
  const router = useRouter();
  const { pending, run } = useAuthFormAction();
  const accept = () =>
    run({
      call: () => authClient.organization.acceptInvitation({ invitationId }),
      messages: {
        pending: t("joining", { organization: name }),
        success: t("joined", { organization: name }),
      },
      onSuccess: () => router.refresh(),
    });
  return (
    <Button type="button" variant="outline" disabled={pending} onClick={accept}>
      {t("join")}
    </Button>
  );
}
