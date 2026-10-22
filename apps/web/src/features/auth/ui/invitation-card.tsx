"use client";

import { FIXED_ROLES } from "@bibi/core/schemas";
import { Button, Skeleton } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { AuthCard } from "./auth-card";
import { useInvitation } from "./use-invitation";
import { useInvitationActions } from "./use-invitation-actions";

export type InvitationCardProps = { invitationId: string };

/** Accept or decline an organization invitation (link from the invitation mail). */
export function InvitationCard({ invitationId }: InvitationCardProps) {
  const t = useTranslations("auth");
  const errors = useTranslations("errors");
  const roles = useTranslations("role");
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
  const { organizationName, inviterEmail } = invitation;
  const fixed = FIXED_ROLES.find((name) => name === invitation.role);
  const role = fixed ? roles(fixed) : invitation.role;
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
