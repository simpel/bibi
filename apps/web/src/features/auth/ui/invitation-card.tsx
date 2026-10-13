"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { Button, Skeleton, toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ErrorBanner } from "@/components/states/error-banner";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";
import { AuthCard } from "./auth-card";
import { useAuthSubmit } from "./use-auth-submit";
import { useInvitation } from "./use-invitation";

export type InvitationCardProps = { invitationId: string };

/** Accept or decline an organization invitation (link from the invitation mail). */
export function InvitationCard({ invitationId }: InvitationCardProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const invitation = useInvitation({ invitationId });
  const { pending, errorKey, run } = useAuthSubmit();
  if (invitation.status === "loading") return <Skeleton className="h-40 w-full max-w-md" />;
  if (invitation.status === "invalid") {
    return (
      <AuthCard title={t("invitationInvalidTitle")}>
        <ErrorBanner errorKey="invitationInvalid" />
      </AuthCard>
    );
  }
  const { organizationName, inviterEmail, role } = invitation;
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
  return (
    <AuthCard
      title={t("invitationTitle", { organization: organizationName })}
      description={t("invitationDescription", { inviter: inviterEmail, role })}
    >
      <ErrorBanner errorKey={errorKey} />
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" disabled={pending} onClick={decline}>
          {t("declineInvitation")}
        </Button>
        <Button className="flex-1" disabled={pending} onClick={accept}>
          {t("acceptInvitation")}
        </Button>
      </div>
    </AuthCard>
  );
}
