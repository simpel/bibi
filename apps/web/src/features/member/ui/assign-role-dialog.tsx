"use client";

import type { FixedRole, MemberDto } from "@okazi/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { AssignRoleForm } from "./assign-role-form";

export type AssignRoleDialogProps = {
  member: MemberDto;
  roles: FixedRole[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Dialog that gives one member another fixed role. */
export function AssignRoleDialog({ member, roles, open, onOpenChange }: AssignRoleDialogProps) {
  const t = useTranslations("member");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assignRoles")}</DialogTitle>
          <DialogDescription>{t("assignDescription", { name: member.name })}</DialogDescription>
        </DialogHeader>
        {open ? (
          <AssignRoleForm member={member} roles={roles} onDone={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
