import type { BillingOrganizationDto } from "@bibi/core/schemas";
import {
  actionsColumn,
  type ColumnDef,
  createTableColumns,
  dateColumn,
  numberColumn,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { BillingStateBadge } from "@/features/billing/ui/billing-state-badge";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { ExemptSwitch } from "./exempt-switch";
import { TrialEndAction } from "./trial-end-action";

type Column = ColumnDef<BillingOrganizationDto>;

/** Name · plan · exempt · state · trial end · extra seats · change trial end. */
export function useBillingOrganizationColumns(): Column[] {
  const t = useTranslations("admin.billing.organizations");
  const intervals = useTranslations("billing.interval");
  const common = useTranslations("common");
  const format = useDateTimeFormat();
  return useMemo(
    () =>
      createTableColumns<BillingOrganizationDto>({
        primary: [
          {
            id: "name",
            header: t("columns.name"),
            accessorFn: (row) => row.name,
            cell: ({ row: { original } }) => (
              <span className="grid">
                <span className="font-medium">{original.name}</span>
                <span className="text-xs text-muted-foreground">{original.slug}</span>
              </span>
            ),
          },
        ],
        relations: [
          {
            id: "plan",
            header: t("columns.plan"),
            accessorFn: (row) => (row.interval ? intervals(row.interval) : t("noPlan")),
          },
          {
            id: "exempt",
            header: t("columns.exempt"),
            accessorFn: (row) => row.exempt,
            cell: ({ row }) => <ExemptSwitch organization={row.original} />,
          },
        ],
        status: [
          {
            id: "state",
            header: t("columns.state"),
            accessorFn: (row) => row.state,
            cell: ({ row }) => <BillingStateBadge state={row.original.state} />,
          },
        ],
        dates: [
          dateColumn<BillingOrganizationDto>({
            id: "trialEndsAt",
            header: t("columns.trialEndsAt"),
            getSortValue: (row) => new Date(row.trialEndsAt).getTime(),
            cell: (row) => format.date({ instant: row.trialEndsAt }),
          }),
        ],
        numbers: [
          numberColumn<BillingOrganizationDto>({
            id: "extraSeats",
            header: t("columns.extraSeats"),
            getValue: (row) => row.extraSeats,
          }),
        ],
        actions: [
          actionsColumn<BillingOrganizationDto>({
            label: common("actions"),
            cell: (organization) => <TrialEndAction organization={organization} />,
          }),
        ],
      }),
    [t, intervals, common, format],
  );
}
