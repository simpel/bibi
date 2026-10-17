"use client";

import type { FixedRole, MemberDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AssignRoleDialog } from "./assign-role-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";

export type MemberRowActionsProps = { member: MemberDto; roles: FixedRole[] };

/** Assign role / remove menu for one member. */
export function MemberRowActions({ member, roles }: MemberRowActionsProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"assign" | "remove" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setDialog("assign")}>{t("assignRoles")}</DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setDialog("remove")}>
          {t("remove")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <AssignRoleDialog
        member={member}
        roles={roles}
        open={dialog === "assign"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <RemoveMemberDialog
        member={member}
        open={dialog === "remove"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
