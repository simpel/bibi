"use client";

import type { FixedRole, MemberDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { memberRoute } from "@/lib/routes";
import { canManageMember } from "../assignable-roles";
import { MemberRoleForm } from "./member-role-form";
import { MemberRowActions, MemberRowMenu } from "./member-row-actions";
import { useMemberColumns } from "./use-member-columns";

export type MemberTableProps = {
  members: MemberDto[];
  roles: FixedRole[];
  caller: FixedRole | null;
  access: RowAccess;
};

const ALL_ROLES: FixedRole[] = ["admin", "manager", "member"];

function useMemberQualifiers({ members }: { members: MemberDto[] }): TableQualifier<MemberDto>[] {
  const t = useTranslations("member.columns");
  const roleLabel = useTranslations("role");
  return useMemo(
    () => [
      {
        key: "role",
        label: t("roles"),
        hint: ALL_ROLES.map((r) => roleLabel(r)).join(", "),
        pick: (m) => (m.role ? roleLabel(m.role) : undefined),
        options: ALL_ROLES.map((r) => roleLabel(r)),
      },
      {
        key: "email",
        label: t("email"),
        hint: t("email"),
        pick: (m) => m.email,
        options: members.map((m) => m.email),
      },
    ],
    [t, roleLabel, members],
  );
}

/**
 * Staff with their fixed role (ADR 0034). Members the caller's role reaches get an auto-saving
 * role select and the actions menu; the rest are read-only.
 */
export function MemberTable({ members, roles, caller, access }: MemberTableProps) {
  const t = useTranslations("member");
  const roleLabel = useTranslations("role");
  const router = useRouter();
  const manageable = ({ role }: MemberDto) => canManageMember({ caller, member: role });
  const qualifiers = useMemberQualifiers({ members });
  const view = useClientTableView({
    rows: members,
    qualifiers,
    getSearchText: (m) => `${m.name} ${m.email} ${m.role ? roleLabel(m.role) : ""}`,
    totalLabel: (count) => `${count}`,
  });
  const columns = useMemberColumns<MemberDto>({
    linkNames: true,
    renderRole: (member) =>
      access.canEdit && manageable(member) ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: only keeps the row click from firing; the controls inside handle the keyboard
        // biome-ignore lint/a11y/useKeyWithClickEvents: same wrapper, no action of its own
        <div onClick={(event) => event.stopPropagation()}>
          <MemberRoleForm member={member} roles={roles} />
        </div>
      ) : null,
    renderActions: (member) => (
      <MemberRowActions member={member} access={access} manageable={manageable(member)} />
    ),
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} />
      <PersistedDataTable
        tableId="member"
        columns={columns}
        data={view.rows}
        getRowId={(m) => m.id}
        onRowClick={(m) => router.push(memberRoute({ id: m.id }))}
        rowMenu={(m) => <MemberRowMenu member={m} access={access} manageable={manageable(m)} />}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
