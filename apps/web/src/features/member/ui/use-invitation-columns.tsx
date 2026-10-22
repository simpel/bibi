import type { InvitationDto } from "@bibi/core";
import { Link } from "@bibi/i18n/navigation";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/routes";
import { RoleBadge } from "./role-badge";

export type InvitationRow = Pick<InvitationDto, "id" | "email" | "role"> & {
  /** A `Date` on the page, an ISO string in assistant results. */
  expiresAt: Date | string;
};

export type UseInvitationColumnsInput<TRow extends InvitationRow> = {
  /** Link each email to the members settings page (assistant card). */
  linkNames?: boolean;
  /** Row actions menu; omit for no actions column. */
  renderActions?: (row: TRow) => ReactNode;
};

type EmailColumnInput = { header: string; linkNames: boolean };

function emailColumn<TRow extends InvitationRow>({
  header,
  linkNames,
}: EmailColumnInput): ColumnDef<TRow> {
  return {
    id: "email",
    header,
    accessorFn: (i) => i.email,
    cell: ({ row }) =>
      linkNames ? (
        <Link href={ROUTES.adminMembers} className="font-medium hover:underline">
          {row.original.email}
        </Link>
      ) : (
        <span className="font-medium">{row.original.email}</span>
      ),
  };
}

/** Columns of the invitation table, shared by the members page and the assistant card. */
export function useInvitationColumns<TRow extends InvitationRow>({
  linkNames = false,
  renderActions,
}: UseInvitationColumnsInput<TRow>): ColumnDef<TRow>[] {
  const t = useTranslations("member.columns");
  const common = useTranslations("common");
  const format = useFormatter();
  const actionColumn: ColumnDef<TRow>[] = renderActions
    ? [actionsColumn<TRow>({ label: common("actions"), cell: renderActions })]
    : [];
  return [
    emailColumn<TRow>({ header: t("email"), linkNames }),
    {
      id: "role",
      header: t("roles"),
      accessorFn: (i) => i.role ?? "",
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      id: "expires",
      header: t("expires"),
      accessorFn: (i) => new Date(i.expiresAt),
      cell: ({ row }) =>
        format.dateTime(new Date(row.original.expiresAt), {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    ...actionColumn,
  ];
}
