"use client";

import { Button, Skeleton } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { AuthCard } from "./auth-card";
import { useInvitation } from "./use-invitation";
import { useInvitationActions } from "./use-invitation-actions";

export type InvitationCardProps = { invitationId: string };

/** Accept or decline an organization invitation (link from the invitation mail). */
export function InvitationCard({ invitationId }: InvitationCardProps) {
  const t = useTranslations("auth");
  const errors = useTranslations("errors");
  const invitation = useInvitation({ invitationId });
  const { pending, accept, decline } = useInvitationActions({ invitationId });
  if (invitation.status === "loading") return <Skeleton className="h-40 w-full max-w-md" />;
  if (invitation.status === "invalid") {
    return (
      <AuthCard title={t("invitationInvalidTitle")}>
        <p role="alert" className="text-sm text-destructive">
          {errors("invitationInvalid")}
        </p>
      </AuthCard>
    );
  }
  const { organizationName, inviterEmail, role } = invitation;
  return (
    <AuthCard
      title={t("invitationTitle", { organization: organizationName })}
      description={t("invitationDescription", { inviter: inviterEmail, role })}
    >
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
