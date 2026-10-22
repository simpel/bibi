"use client";

import type { FixedRole, MemberDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { RowAccess } from "@/lib/can";
import { canManageMember } from "../assignable-roles";
import { MemberRoleForm } from "./member-role-form";
import { MemberRowActions } from "./member-row-actions";
import { useMemberColumns } from "./use-member-columns";

export type MemberTableProps = {
  members: MemberDto[];
  roles: FixedRole[];
  caller: FixedRole | null;
  access: RowAccess;
};

/**
 * Staff with their fixed role (ADR 0034). Members the caller's role reaches get an auto-saving
 * role select and the actions menu; the rest are read-only.
 */
export function MemberTable({ members, roles, caller, access }: MemberTableProps) {
  const t = useTranslations("member");
  const manageable = ({ role }: MemberDto) => canManageMember({ caller, member: role });
  const columns = useMemberColumns<MemberDto>({
    linkNames: true,
    renderRole: (member) =>
      access.canEdit && manageable(member) ? (
        <MemberRoleForm member={member} roles={roles} />
      ) : null,
    ...(access.canEdit || access.canRemove
      ? {
          renderActions: (member) =>
            manageable(member) ? <MemberRowActions member={member} access={access} /> : null,
        }
      : {}),
  });
  return (
    <PersistedDataTable
      tableId="member"
      columns={columns}
      data={members}
      getRowId={(member) => member.id}
      emptyText={t("empty")}
    />
  );
}
