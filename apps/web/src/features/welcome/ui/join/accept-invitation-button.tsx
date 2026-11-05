"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useAuthFormAction } from "@/features/auth/ui/use-auth-form-action";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";

import { ROUTES } from "@/lib/routes";

export type AcceptInvitationButtonProps = {
  invitationId: string;
  name: string;
  stay?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

/** Join through a pending invitation (Better Auth) (ADR 0078). */
export function AcceptInvitationButton({
  invitationId,
  name,
  stay,
  variant = stay ? "outline" : "default",
  size,
  className = stay ? undefined : "w-full",
}: AcceptInvitationButtonProps) {
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
      onSuccess: () => {
        if (stay) {
          router.refresh();
        } else {
          router.replace(ROUTES.home);
          router.refresh();
        }
      },
    });
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={accept}
    >
      {stay ? t("join") : t("joinOrganization", { organization: name })}
    </Button>
  );
}
