"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { cancelPaymentAction } from "../actions";

export type CancelPaymentButtonProps = { id: string };

/** Cancels a pending payment and its open link at the provider, after a confirmation. */
export function CancelPaymentButton({ id }: CancelPaymentButtonProps) {
  const t = useTranslations("payment.cancel");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { run, pending } = useToastAction();
  const cancel = () =>
    run({
      action: () => cancelPaymentAction({ id }),
      messages: { pending: common("saving"), success: t("done") },
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    });
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        {t("action")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("title")}
        description={t("confirm")}
        confirmLabel={t("action")}
        pending={pending}
        onConfirm={cancel}
      />
    </>
  );
}
