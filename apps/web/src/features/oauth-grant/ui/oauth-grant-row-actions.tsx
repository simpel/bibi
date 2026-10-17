"use client";

import type { OauthGrantDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { revokeOauthGrantAction } from "../actions";

export type OauthGrantRowActionsProps = { grant: OauthGrantDto };

/** Disconnect menu; the client's tokens stop working as soon as it succeeds. */
export function OauthGrantRowActions({ grant }: OauthGrantRowActionsProps) {
  const t = useTranslations("integration.oauthGrants");
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
        description={t("revokeConfirm", { name: grant.name })}
        messages={{ pending: t("revoking"), success: t("revoked") }}
        action={() => revokeOauthGrantAction({ clientId: grant.clientId })}
      />
    </>
  );
}
