import type { MemberDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { actionsColumn, type ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/routes";
import { RoleBadge } from "./role-badge";

export type MemberRow = Pick<MemberDto, "id" | "name" | "email" | "role">;

export type UseMemberColumnsInput<TRow extends MemberRow> = {
  /** Link each name to the members settings page (assistant card). */
  linkNames?: boolean;
  /** Row actions menu; omit for no actions column. */
  renderActions?: (row: TRow) => ReactNode;
};

/** Columns of the member table, shared by the members page and the assistant card. */
export function useMemberColumns<TRow extends MemberRow>({
  linkNames = false,
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
          <Link href={ROUTES.settingsMembers} className="font-medium hover:underline">
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
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    ...actionColumn,
  ];
}
