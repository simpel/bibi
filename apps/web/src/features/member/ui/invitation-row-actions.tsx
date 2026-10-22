"use client";

import type { InvitationDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CancelInvitationDialog } from "./cancel-invitation-dialog";

export type InvitationRowActionsProps = { invitation: InvitationDto };

/** Revoke menu for one pending invitation. */
export function InvitationRowActions({ invitation }: InvitationRowActionsProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem destructive onSelect={() => setOpen(true)}>
          {t("revokeInvitation")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <CancelInvitationDialog invitation={invitation} open={open} onOpenChange={setOpen} />
    </>
  );
}
