"use client";

import type { ApiKeyDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { revokeApiKeyAction } from "../actions";

export type ApiKeyRowActionsProps = { apiKey: ApiKeyDto };

/** Revoke menu; requests with the key fail as soon as it succeeds. */
export function ApiKeyRowActions({ apiKey }: ApiKeyRowActionsProps) {
  const t = useTranslations("integration.apiKeys");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem destructive onSelect={() => setOpen(true)}>
          {t("revoke")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <ConfirmActionDialog
        open={open}
        onOpenChange={setOpen}
        label={t("revoke")}
        description={t("revokeConfirm", { name: apiKey.name })}
        messages={{ pending: t("revoking"), success: t("revoked") }}
        action={() => revokeApiKeyAction({ id: apiKey.id })}
      />
    </>
  );
}
