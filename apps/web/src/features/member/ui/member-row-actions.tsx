"use client";

import type { MemberDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { memberPermissionsRoute } from "@/lib/routes";
import { RemoveMemberDialog } from "./remove-member-dialog";

export type MemberRowActionsProps = { member: MemberDto; access: RowAccess };

/** Permissions and remove menu for one member; the role is changed in its own column. */
export function MemberRowActions({ member, access }: MemberRowActionsProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const [removing, setRemoving] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {access.canEdit ? (
          <DropdownMenuItem asChild>
            <Link href={memberPermissionsRoute({ id: member.id })}>{t("permissions")}</Link>
          </DropdownMenuItem>
        ) : null}
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setRemoving(true)}>
            {t("remove")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <RemoveMemberDialog member={member} open={removing} onOpenChange={setRemoving} />
    </>
  );
}
