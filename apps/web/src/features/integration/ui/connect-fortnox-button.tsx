"use client";

import { Button, FortnoxLogo } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { connectFortnoxAction } from "../actions";

export type ConnectFortnoxButtonProps = {
  /** Reconnect keeps the label short and quiet; a first connect is the primary action. */
  reconnect: boolean;
  disabled: boolean;
};

/** Starts the connection, then sends the browser to Fortnox to approve it (ADR 0087). */
export function ConnectFortnoxButton({ reconnect, disabled }: ConnectFortnoxButtonProps) {
  const t = useTranslations("integration.fortnox");
  const { run, pending } = useToastAction();
  const start = () =>
    run({
      action: connectFortnoxAction,
      messages: { pending: t("connecting"), success: t("redirecting") },
      onSuccess: ({ value }) => window.location.assign(value.authorizeUrl),
    });
  return (
    <Button
      variant={reconnect ? "outline" : "fortnox"}
      disabled={disabled || pending}
      onClick={start}
    >
      {reconnect ? null : <FortnoxLogo className="text-brand-fortnox-foreground" aria-hidden />}
      {reconnect ? t("reconnect") : t("connect")}
    </Button>
  );
}
