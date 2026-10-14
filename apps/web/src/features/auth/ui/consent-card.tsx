"use client";

import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { AuthCard } from "./auth-card";
import { ConsentScopes } from "./consent-scopes";
import { useAuthFormAction } from "./use-auth-form-action";
import { useOAuthClientName } from "./use-oauth-client-name";

export type ConsentCardProps = { clientId: string | null; scopes: string[] };

/** OAuth consent: shows who asks for what; Better Auth redirects on accept/deny. */
export function ConsentCard({ clientId, scopes }: ConsentCardProps) {
  const t = useTranslations("auth");
  const clientName = useOAuthClientName({ clientId }) ?? t("unknownClient");
  const { pending, run } = useAuthFormAction();
  const respond = ({ accept }: { accept: boolean }) =>
    run({
      call: () => authClient.oauth2.consent({ accept }),
      messages: accept
        ? { pending: t("consentAllowing"), success: t("consentAllowed") }
        : { pending: t("consentDenying"), success: t("consentDenied") },
      onSuccess: () => undefined,
    });
  return (
    <AuthCard
      title={t("consentTitle", { client: clientName })}
      description={t("consentDescription", { client: clientName })}
    >
      <ConsentScopes scopes={scopes} />
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={pending}
          onClick={() => respond({ accept: false })}
        >
          {t("deny")}
        </Button>
        <Button className="flex-1" disabled={pending} onClick={() => respond({ accept: true })}>
          {t("allow")}
        </Button>
      </div>
    </AuthCard>
  );
}
