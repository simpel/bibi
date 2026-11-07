"use client";

import type { ApiKeyDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { revokeApiKeyAction } from "../actions";

export type RevokeApiKeyDialogProps = {
  apiKey: ApiKeyDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Confirms the revoke; requests with the key fail as soon as it succeeds. */
export function RevokeApiKeyDialog({ apiKey, open, onOpenChange }: RevokeApiKeyDialogProps) {
  const t = useTranslations("integration.apiKeys");
  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      label={t("revoke")}
      description={t("revokeConfirm", { name: apiKey.name })}
      messages={{ pending: t("revoking"), success: t("revoked") }}
      action={() => revokeApiKeyAction({ id: apiKey.id })}
    />
  );
}
