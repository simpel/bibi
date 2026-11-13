"use client";

import type { IntegrationConnectionDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { disconnectPaymentAccountAction } from "@/features/payment-account/actions";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { disconnectIntegrationAction } from "../actions";

export type DisconnectProviderButtonProps = {
  connection: Pick<IntegrationConnectionDto, "provider" | "connectKind">;
  name: string;
};

/**
 * Disconnects a provider after a confirmation (CLAUDE.md "Forms"). A payout account keeps its
 * account at the provider and connects again to the same one (ADR 0090).
 */
export function DisconnectProviderButton({ connection, name }: DisconnectProviderButtonProps) {
  const t = useTranslations("integration.card");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { run, pending } = useToastAction();
  const hosted = connection.connectKind === "HOSTED_ONBOARDING";
  const messages = { pending: t("disconnecting", { name }), success: t("disconnected", { name }) };
  const onSuccess = () => {
    setOpen(false);
    router.refresh();
  };
  const disconnect = () =>
    hosted
      ? run({ action: disconnectPaymentAccountAction, messages, onSuccess })
      : run({
          action: () => disconnectIntegrationAction({ provider: connection.provider }),
          messages,
          onSuccess,
        });
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        {t("disconnect")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("disconnectTitle", { name })}
        description={t(hosted ? "disconnectHostedConfirm" : "disconnectConfirm", { name })}
        confirmLabel={t("disconnect")}
        pending={pending}
        onConfirm={disconnect}
      />
    </>
  );
}
