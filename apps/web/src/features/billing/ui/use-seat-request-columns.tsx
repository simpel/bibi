import type { SeatRequestDto } from "@bibi/core/schemas";
import { actionsColumn, type ColumnDef, createTableColumns, dateColumn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { RoleBadge } from "@/features/member/ui/role-badge";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";

export type UseSeatRequestColumnsInput = {
  /** Approve and decline; omit for no actions column. */
  renderActions?: (row: SeatRequestDto) => ReactNode;
};

/** Email · role · requested, then the row actions. */
export function useSeatRequestColumns({
  renderActions,
}: UseSeatRequestColumnsInput): ColumnDef<SeatRequestDto>[] {
  const t = useTranslations("billing.requests.columns");
  const common = useTranslations("common");
  const format = useDateTimeFormat();
  return createTableColumns<SeatRequestDto>({
    primary: [
      {
        id: "email",
        header: t("email"),
        accessorFn: (row) => row.email,
        cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
      },
    ],
    relations: [
      {
        id: "role",
        header: t("role"),
        accessorFn: (row) => row.role ?? "",
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
    ],
    dates: [
      dateColumn<SeatRequestDto>({
        id: "requested",
        header: t("requested"),
        getSortValue: (row) => new Date(row.createdAt).getTime(),
        cell: (row) => format.dateTime({ instant: row.createdAt }),
      }),
    ],
    actions: renderActions
      ? [actionsColumn<SeatRequestDto>({ label: common("actions"), cell: renderActions })]
      : [],
  });
}
