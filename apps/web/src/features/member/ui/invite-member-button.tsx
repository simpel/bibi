"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@okazi/ui";
import { MailPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InviteMemberForm } from "./invite-member-form";

export type InviteMemberButtonProps = { roleNames: string[] };

/** Opens the invitation dialog: email and the roles the invitee gets. */
export function InviteMemberButton({ roleNames }: InviteMemberButtonProps) {
  const t = useTranslations("member");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <MailPlusIcon />
        {t("invite")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("invite")}</DialogTitle>
            <DialogDescription>{t("inviteDescription")}</DialogDescription>
          </DialogHeader>
          {open ? <InviteMemberForm roleNames={roleNames} onDone={() => setOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
