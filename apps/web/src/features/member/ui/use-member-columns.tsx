import type { MemberDto } from "@bibi/core";
import { actionsColumn, type ColumnDef, ContactName } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { memberRoute } from "@/lib/routes";
import { RoleBadge } from "./role-badge";

export type MemberRow = Pick<MemberDto, "id" | "name" | "email" | "role">;

export type UseMemberColumnsInput<TRow extends MemberRow> = {
  /** Link each name to the member's detail page; the name opens the card either way. */
  linkNames?: boolean;
  /** The role cell, e.g. an auto-saving select; `null` falls back to the badge. */
  renderRole?: (row: TRow) => ReactNode;
  /** Row actions menu; omit for no actions column. */
  renderActions?: (row: TRow) => ReactNode;
};

/** Columns of the member table, shared by the members page and the assistant card. */
export function useMemberColumns<TRow extends MemberRow>({
  linkNames = false,
  renderRole,
  renderActions,
}: UseMemberColumnsInput<TRow>): ColumnDef<TRow>[] {
  const t = useTranslations("member.columns");
  const common = useTranslations("common");
  const actionColumn: ColumnDef<TRow>[] = renderActions
    ? [actionsColumn<TRow>({ label: common("actions"), cell: renderActions })]
    : [];
  return [
    {
      id: "name",
      header: t("name"),
      accessorFn: (m) => m.name,
      cell: ({ row: { original } }) => (
        <ContactName
          contact={original}
          href={linkNames ? memberRoute({ id: original.id }) : undefined}
          className="font-medium"
        />
      ),
    },
    { id: "email", header: t("email"), accessorFn: (m) => m.email },
    {
      id: "role",
      header: t("roles"),
      accessorFn: (m) => m.role ?? "",
      cell: ({ row }) => renderRole?.(row.original) ?? <RoleBadge role={row.original.role} />,
    },
    ...actionColumn,
  ];
}
