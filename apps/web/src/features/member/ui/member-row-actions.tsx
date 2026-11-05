"use client";

import type { MemberDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { ExternalLinkIcon, ShieldIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { Link, useRouter } from "@/lib/navigation";
import { memberPermissionsRoute, memberRoute } from "@/lib/routes";
import { RemoveMemberDialog } from "./remove-member-dialog";

export type MemberRowActionsProps = {
  member: MemberDto;
  access: RowAccess;
  manageable?: boolean | undefined;
};

/** Permissions and remove menu for one member; the role is changed in its own column. */
export function MemberRowActions({ member, access, manageable = false }: MemberRowActionsProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const [removing, setRemoving] = useState(false);
  const router = useRouter();
  const detail = memberRoute({ id: member.id });
  const primary =
    access.canEdit && manageable
      ? [
          {
            label: t("permissions"),
            icon: ShieldIcon,
            onClick: () => router.push(memberPermissionsRoute({ id: member.id })),
          },
        ]
      : [{ label: common("open"), icon: ExternalLinkIcon, onClick: () => router.push(detail) }];
  return (
    <>
      <DataTableRowActions label={common("actions")} primary={primary}>
        {access.canRemove && manageable ? (
          <DropdownMenuItem destructive onSelect={() => setRemoving(true)}>
            {t("remove")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <RemoveMemberDialog member={member} open={removing} onOpenChange={setRemoving} />
    </>
  );
}

/** Right-click context menu for a member row. */
export function MemberRowMenu({ member, access, manageable = false }: MemberRowActionsProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const detail = memberRoute({ id: member.id });
  return (
    <>
      <ContextMenuItem asChild>
        <Link href={detail}>
          <ExternalLinkIcon />
          {common("open")}
        </Link>
      </ContextMenuItem>
      {access.canEdit && manageable ? (
        <ContextMenuItem asChild>
          <Link href={memberPermissionsRoute({ id: member.id })}>
            <ShieldIcon />
            {t("permissions")}
          </Link>
        </ContextMenuItem>
      ) : null}
    </>
  );
}
