"use client";

import type { OauthGrantDto } from "@bibi/core";
import { DataTableRowAction } from "@bibi/ui";
import { UnplugIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { revokeOauthGrantAction } from "../actions";

export type OauthGrantRowActionsProps = { grant: OauthGrantDto };

/** Disconnect button; the client's tokens stop working as soon as it succeeds. */
export function OauthGrantRowActions({ grant }: OauthGrantRowActionsProps) {
  const t = useTranslations("integration.oauthGrants");
  const [open, setOpen] = useState(false);
  return (
    <>
      <DataTableRowAction
        destructive
        label={t("revoke")}
        icon={UnplugIcon}
        onClick={() => setOpen(true)}
      />
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
