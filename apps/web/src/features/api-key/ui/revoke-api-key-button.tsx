"use client";

import type { ApiKeyDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { revokeApiKeyAction } from "../actions";

export type RevokeApiKeyButtonProps = { apiKey: ApiKeyDto };

/** Revoke confirmation; requests with the key fail as soon as it succeeds. */
export function RevokeApiKeyButton({ apiKey }: RevokeApiKeyButtonProps) {
  const t = useTranslations("integration.apiKeys");
  return (
    <ConfirmActionButton
      label={t("revoke")}
      description={t("revokeConfirm", { name: apiKey.name })}
      messages={{ pending: t("revoking"), success: t("revoked") }}
      action={() => revokeApiKeyAction({ id: apiKey.id })}
    />
  );
}
