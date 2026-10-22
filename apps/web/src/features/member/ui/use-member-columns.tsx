import type { MemberDto } from "@bibi/core";
import { Link } from "@bibi/i18n/navigation";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { memberRoute } from "@/lib/routes";
import { RoleBadge } from "./role-badge";

export type MemberRow = Pick<MemberDto, "id" | "name" | "email" | "role">;

export type UseMemberColumnsInput<TRow extends MemberRow> = {
  /** Link each name to the member's detail page. */
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
      cell: ({ row }) =>
        linkNames ? (
          <Link href={memberRoute({ id: row.original.id })} className="font-medium hover:underline">
            {row.original.name}
          </Link>
        ) : (
          <span className="font-medium">{row.original.name}</span>
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
