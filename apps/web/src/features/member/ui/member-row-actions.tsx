"use client";

import type { MemberDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { ShieldIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { memberPermissionsRoute } from "@/lib/routes";
import { RemoveMemberDialog } from "./remove-member-dialog";

export type MemberRowActionsProps = { member: MemberDto; access: RowAccess };

/** Permissions and remove menu for one member; the role is changed in its own column. */
export function MemberRowActions({ member, access }: MemberRowActionsProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const [removing, setRemoving] = useState(false);
  const router = useRouter();
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={
          access.canEdit
            ? [
                {
                  label: t("permissions"),
                  icon: ShieldIcon,
                  onClick: () => router.push(memberPermissionsRoute({ id: member.id })),
                },
              ]
            : []
        }
      >
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
