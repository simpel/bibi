"use client";

import type { InvitationDto } from "@bibi/core";
import { DataTableRowAction } from "@bibi/ui";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CancelInvitationDialog } from "./cancel-invitation-dialog";

export type InvitationRowActionsProps = { invitation: InvitationDto };

/** Revoke button for one pending invitation. */
export function InvitationRowActions({ invitation }: InvitationRowActionsProps) {
  const t = useTranslations("member");
  const [open, setOpen] = useState(false);
  return (
    <>
      <DataTableRowAction
        destructive
        label={t("revokeInvitation")}
        icon={XIcon}
        onClick={() => setOpen(true)}
      />
      <CancelInvitationDialog invitation={invitation} open={open} onOpenChange={setOpen} />
    </>
  );
}
