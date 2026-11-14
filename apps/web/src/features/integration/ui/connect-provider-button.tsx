"use client";

import type { IntegrationConnectionDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { startPaymentOnboardingAction } from "@/features/payment-account/actions";
import { useToastAction } from "@/lib/use-toast-action";
import { connectIntegrationAction } from "../actions";
import { ConnectFormDialog } from "./connect-form-dialog";
import type { ProviderGuide } from "./how-to-connect-button";

export type ConnectProviderButtonProps = {
  connection: Pick<
    IntegrationConnectionDto,
    "provider" | "status" | "configured" | "connectKind" | "credentialFields"
  >;
  /** The provider's name in the viewer's language. */
  name: string;
  /** Shown in the credentials form, so what to prepare is one click away there too. */
  guide: ProviderGuide | null;
};

type Label = "connect" | "reconnect" | "continueOnboarding";

function labelOf({ connection }: Pick<ConnectProviderButtonProps, "connection">): Label {
  const { status, connectKind } = connection;
  if (status === "NOT_CONNECTED" || status === "DISCONNECTED") return "connect";
  if (connectKind === "HOSTED_ONBOARDING" && status !== "CONNECTED") return "continueOnboarding";
  return "reconnect";
}

/**
 * Connects a provider the way its data says (ADR 0100): OAuth and hosted onboarding send the
 * browser to the provider's page; credentials open a form for what the provider asks for.
 */
export function ConnectProviderButton({ connection, name, guide }: ConnectProviderButtonProps) {
  const t = useTranslations("integration.card");
  const { run, pending } = useToastAction();
  const [open, setOpen] = useState(false);
  const label = labelOf({ connection });
  const messages = { pending: t("connecting", { name }), success: t("redirecting", { name }) };
  const start = () => {
    if (connection.connectKind === "CREDENTIALS") return setOpen(true);
    if (connection.connectKind === "HOSTED_ONBOARDING") {
      return run({
        action: startPaymentOnboardingAction,
        messages,
        onSuccess: ({ value }) => {
          if (value.onboardingUrl) window.location.assign(value.onboardingUrl);
        },
      });
    }
    run({
      action: () => connectIntegrationAction({ input: { provider: connection.provider } }),
      messages,
      onSuccess: ({ value }) => {
        if (value.authorizeUrl) window.location.assign(value.authorizeUrl);
      },
    });
  };
  return (
    <>
      <Button disabled={!connection.configured || pending} onClick={start}>
        {t(label)}
      </Button>
      {connection.connectKind === "CREDENTIALS" ? (
        <ConnectFormDialog
          open={open}
          onOpenChange={setOpen}
          provider={connection.provider}
          fields={connection.credentialFields}
          name={name}
          guide={guide}
        />
      ) : null}
    </>
  );
}
