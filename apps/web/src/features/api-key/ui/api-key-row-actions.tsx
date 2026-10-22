"use client";

import type { ApiKeyDto } from "@bibi/core";
import { Link } from "@bibi/i18n/navigation";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { apiKeyPermissionsRoute, apiKeyUpdateRoute } from "@/lib/routes";
import { revokeApiKeyAction } from "../actions";

export type ApiKeyRowActionsProps = { apiKey: ApiKeyDto };

/** Edit, permissions and revoke; requests with the key fail as soon as a revoke succeeds. */
export function ApiKeyRowActions({ apiKey }: ApiKeyRowActionsProps) {
  const t = useTranslations("integration.apiKeys");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem asChild>
          <Link href={apiKeyUpdateRoute({ id: apiKey.id })}>{t("edit")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={apiKeyPermissionsRoute({ id: apiKey.id })}>{t("permissions")}</Link>
        </DropdownMenuItem>
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
