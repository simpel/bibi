"use client";

import type { InvitationDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
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

export type InvitationRowMenuProps = {
  invitation: InvitationDto;
  /** Opens the confirmation; the dialog lives in the table so it outlives the menu. */
  onRevoke: (invitation: InvitationDto) => void;
};

/** Right-click menu of one invitation: the same revoke action. */
export function InvitationRowMenu({ invitation, onRevoke }: InvitationRowMenuProps) {
  const t = useTranslations("member");
  return (
    <ContextMenuItem destructive onSelect={() => onRevoke(invitation)}>
      <XIcon />
      {t("revokeInvitation")}
    </ContextMenuItem>
  );
}
