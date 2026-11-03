import type { BillingOrganizationDto } from "@bibi/core/schemas";
import { actionsColumn, type ColumnDef } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { BillingStateBadge } from "@/features/billing/ui/billing-state-badge";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { ExemptSwitch } from "./exempt-switch";
import { TrialEndAction } from "./trial-end-action";

type Column = ColumnDef<BillingOrganizationDto>;

function nameColumn({ header }: { header: string }): Column {
  return {
    id: "name",
    header,
    accessorFn: (row) => row.name,
    cell: ({ row: { original } }) => (
      <span className="grid">
        <span className="font-medium">{original.name}</span>
        <span className="text-xs text-muted-foreground">{original.slug}</span>
      </span>
    ),
  };
}

/** The superadmin's two levers: exempt, and the trial end in the row actions. */
function leverColumns({ header, label }: { header: string; label: string }): Column[] {
  return [
    {
      id: "exempt",
      header,
      accessorFn: (row) => row.exempt,
      cell: ({ row }) => <ExemptSwitch organization={row.original} />,
    },
    actionsColumn<BillingOrganizationDto>({
      label,
      cell: (organization) => <TrialEndAction organization={organization} />,
    }),
  ];
}

/** Name · state · trial end · plan · extra seats · exempt · change trial end. */
export function useBillingOrganizationColumns(): Column[] {
  const t = useTranslations("admin.billing.organizations");
  const intervals = useTranslations("billing.interval");
  const common = useTranslations("common");
  const format = useDateTimeFormat();
  return [
    nameColumn({ header: t("columns.name") }),
    {
      id: "state",
      header: t("columns.state"),
      accessorFn: (row) => row.state,
      cell: ({ row }) => <BillingStateBadge state={row.original.state} />,
    },
    {
      id: "trialEndsAt",
      header: t("columns.trialEndsAt"),
      accessorFn: (row) => new Date(row.trialEndsAt),
      cell: ({ row }) => format.date({ instant: row.original.trialEndsAt }),
    },
    {
      id: "plan",
      header: t("columns.plan"),
      accessorFn: (row) => (row.interval ? intervals(row.interval) : t("noPlan")),
    },
    { id: "extraSeats", header: t("columns.extraSeats"), accessorFn: (row) => row.extraSeats },
    ...leverColumns({ header: t("columns.exempt"), label: common("actions") }),
  ];
}
