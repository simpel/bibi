"use client";

import type { RoleDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { RoleForm } from "./role-form";

export type RoleDialogProps = {
  /** Present = edit mode, absent = create mode. */
  role?: RoleDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RoleDialog({ role, open, onOpenChange }: RoleDialogProps) {
  const t = useTranslations("role");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {role ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <RoleForm role={role} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
