"use client";

import type { InvitationDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { cancelInvitationAction } from "../actions";

export type CancelInvitationDialogProps = {
  invitation: InvitationDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Confirm → `member.cancelInvitation` → one toast; the emailed link stops working. */
export function CancelInvitationDialog({
  invitation,
  open,
  onOpenChange,
}: CancelInvitationDialogProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const revoke = () =>
    run({
      action: () => cancelInvitationAction({ id: invitation.id }),
      messages: { pending: common("removing"), success: t("invitationRevoked") },
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("revokeInvitation")}
      description={t("revokeConfirm", { email: invitation.email })}
      confirmLabel={t("revokeInvitation")}
      pending={pending}
      onConfirm={revoke}
    />
  );
}
