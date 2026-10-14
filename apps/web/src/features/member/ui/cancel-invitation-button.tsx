"use client";

import type { InvitationDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { cancelInvitationAction } from "../actions";

export type CancelInvitationButtonProps = { invitation: InvitationDto };

/** Confirm → `member.cancelInvitation` → one toast; the emailed link stops working. */
export function CancelInvitationButton({ invitation }: CancelInvitationButtonProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { run, pending } = useToastAction();
  const revoke = () =>
    run({
      action: () => cancelInvitationAction({ id: invitation.id }),
      messages: { pending: common("removing"), success: t("invitationRevoked") },
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    });
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t("revokeInvitation")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("revokeInvitation")}
        description={t("revokeConfirm", { email: invitation.email })}
        confirmLabel={t("revokeInvitation")}
        pending={pending}
        onConfirm={revoke}
      />
    </>
  );
}
