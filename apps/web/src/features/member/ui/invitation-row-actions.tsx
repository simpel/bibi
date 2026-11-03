"use client";

import type { InvitationDto } from "@bibi/core";
import { DataTableRowActions } from "@bibi/ui";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CancelInvitationDialog } from "./cancel-invitation-dialog";

export type InvitationRowActionsProps = { invitation: InvitationDto };

/** Revoke button for one pending invitation. */
export function InvitationRowActions({ invitation }: InvitationRowActionsProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={[
          {
            destructive: true,
            label: t("revokeInvitation"),
            icon: XIcon,
            onClick: () => setOpen(true),
          },
        ]}
      />
      <CancelInvitationDialog invitation={invitation} open={open} onOpenChange={setOpen} />
    </>
  );
}
