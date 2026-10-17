"use client";

import type { FixedRole, MemberDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { canManageMember } from "../assignable-roles";
import { MemberRowActions } from "./member-row-actions";
import { useMemberColumns } from "./use-member-columns";

export type MemberTableProps = {
  members: MemberDto[];
  roles: FixedRole[];
  caller: FixedRole | null;
  canAdmin: boolean;
};

/** Staff with their fixed role (ADR 0034); actions only for members the caller's role reaches. */
export function MemberTable({ members, roles, caller, canAdmin }: MemberTableProps) {
  const t = useTranslations("member");
  const columns = useMemberColumns<MemberDto>({
    ...(canAdmin
      ? {
          renderActions: (member) =>
            canManageMember({ caller, member: member.role }) ? (
              <MemberRowActions member={member} roles={roles} />
            ) : null,
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
