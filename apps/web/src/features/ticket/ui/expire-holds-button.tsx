"use client";

import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { expireTicketHoldsAction } from "../actions";

/**
 * Runs `ticket.expireHolds` by hand (ADR 0044): lines in an expiring state on tickets whose
 * holdsUntil has passed fall to their expiry state. The scheduler does it every 15 minutes.
 */
export function ExpireHoldsButton() {
  const t = useTranslations("ticket");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, run } = useToastAction();
  const expire = () =>
    run({
      action: () => expireTicketHoldsAction(),
      messages: { pending: common("saving"), success: t("holdsExpired") },
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    });
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t("expireHolds")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("expireHolds")}
        description={t("expireHoldsConfirm")}
        confirmLabel={t("expireHolds")}
        pending={pending}
        onConfirm={expire}
      />
    </>
  );
}
