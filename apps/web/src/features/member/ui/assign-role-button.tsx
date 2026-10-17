"use client";

import type { FixedRole, MemberDto } from "@okazi/core";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AssignRoleForm } from "./assign-role-form";

export type AssignRoleButtonProps = { member: MemberDto; roles: FixedRole[] };

/** Opens the dialog that gives one member another fixed role. */
export function AssignRoleButton({ member, roles }: AssignRoleButtonProps) {
  const t = useTranslations("member");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t("assignRoles")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("assignRoles")}</DialogTitle>
            <DialogDescription>{t("assignDescription", { name: member.name })}</DialogDescription>
          </DialogHeader>
          {open ? (
            <AssignRoleForm member={member} roles={roles} onDone={() => setOpen(false)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
