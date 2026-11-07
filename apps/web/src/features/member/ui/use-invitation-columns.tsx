import type { InvitationDto } from "@bibi/core";
import {
  actionsColumn,
  type ColumnDef,
  createTableColumns,
  dateColumn,
  statusColumn,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { RoleBadge } from "./role-badge";

export type InvitationRow = Pick<InvitationDto, "id" | "email" | "role"> & {
  /** Present on the members page; assistant results may omit it. */
  status?: InvitationDto["status"];
  /** A `Date` on the page, an ISO string in assistant results. */
  expiresAt: Date | string;
};

export type UseInvitationColumnsInput<TRow extends InvitationRow> = {
  /** Link each email to the members settings page (assistant card). */
  linkNames?: boolean;
  /** Adds the status column (pending, waiting for a seat); needs rows with a `status`. */
  showStatus?: boolean;
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
  showStatus = false,
  renderActions,
}: UseInvitationColumnsInput<TRow>): ColumnDef<TRow>[] {
  const t = useTranslations("member.columns");
  const statuses = useTranslations("member.invitationStatus");
  const common = useTranslations("common");
  const format = useDateTimeFormat();
  return createTableColumns<TRow>({
    primary: [emailColumn<TRow>({ header: t("email"), linkNames })],
    relations: [
      {
        id: "role",
        header: t("roles"),
        accessorFn: (i) => i.role ?? "",
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
    ],
    status: showStatus
      ? [
          statusColumn<TRow>({
            header: common("status"),
            getStatus: (i) => (i.status ? { label: statuses(i.status) } : null),
          }),
        ]
      : [],
    dates: [
      dateColumn<TRow>({
        id: "expires",
        header: t("expires"),
        getSortValue: (i) => new Date(i.expiresAt).getTime(),
        cell: (i) => format.dateTime({ instant: i.expiresAt }),
      }),
    ],
    actions: renderActions
      ? [actionsColumn<TRow>({ label: common("actions"), cell: renderActions })]
      : [],
  });
}
