"use client";

import type { OauthGrantDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { revokeOauthGrantAction } from "../actions";

export type RevokeOauthGrantButtonProps = { grant: OauthGrantDto };

/** Disconnect confirmation; the client's tokens stop working as soon as it succeeds. */
export function RevokeOauthGrantButton({ grant }: RevokeOauthGrantButtonProps) {
  const t = useTranslations("integration.oauthGrants");
  return (
    <ConfirmActionButton
      label={t("revoke")}
      description={t("revokeConfirm", { name: grant.name })}
      messages={{ pending: t("revoking"), success: t("revoked") }}
      action={() => revokeOauthGrantAction({ clientId: grant.clientId })}
    />
  );
}
