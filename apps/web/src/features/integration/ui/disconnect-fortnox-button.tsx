"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { disconnectFortnoxAction } from "../actions";

/** Disconnects Fortnox after a confirmation; the outcome is one toast (CLAUDE.md "Forms"). */
export function DisconnectFortnoxButton() {
  const t = useTranslations("integration.fortnox");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { run, pending } = useToastAction();
  const disconnect = () =>
    run({
      action: disconnectFortnoxAction,
      messages: { pending: t("disconnecting"), success: t("disconnected") },
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    });
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t("disconnect")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("disconnect")}
        description={t("disconnectConfirm")}
        confirmLabel={t("disconnect")}
        pending={pending}
        onConfirm={disconnect}
      />
    </>
  );
}
