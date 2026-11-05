"use client";

import type { BillingAccessState, BillingOrganizationDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import type { QuickFilterPill } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useBillingOrganizationColumns } from "./use-billing-organization-columns";

const ACCESS_STATES: readonly BillingAccessState[] = [
  "TRIAL",
  "ACTIVE",
  "PAST_DUE",
  "REQUIRED",
  "EXEMPT",
  "UNCONFIGURED",
];

export type OrganizationTableProps = { organizations: BillingOrganizationDto[] };

/** Every organization's billing: state, trial, plan, and the superadmin's two levers. */
export function OrganizationTable({ organizations }: OrganizationTableProps) {
  const t = useTranslations("admin.billing.organizations");
  const states = useTranslations("billing.state");
  const intervals = useTranslations("billing.interval");
  const common = useTranslations("common");
  const columns = useBillingOrganizationColumns();
  const qualifiers = useMemo<TableQualifier<BillingOrganizationDto>[]>(
    () => [
      {
        key: "status",
        label: t("columns.state"),
        options: ACCESS_STATES.map((state) => states(state)),
        pick: (row) => states(row.state),
      },
      {
        key: "type",
        label: t("columns.plan"),
        options: Array.from(
          new Set(
            organizations.map((row) => (row.interval ? intervals(row.interval) : t("noPlan"))),
          ),
        ),
        pick: (row) => (row.interval ? intervals(row.interval) : t("noPlan")),
      },
    ],
    [t, states, intervals, organizations],
  );
  const stateWord = t("columns.state").toLowerCase();
  const pills = useMemo<QuickFilterPill[]>(
    () => [
      { key: "all", label: common("readFilter.all"), query: undefined },
      { key: "trial", label: states("TRIAL"), query: `${stateWord}:"${states("TRIAL")}"` },
      { key: "active", label: states("ACTIVE"), query: `${stateWord}:"${states("ACTIVE")}"` },
      { key: "exempt", label: states("EXEMPT"), query: `${stateWord}:"${states("EXEMPT")}"` },
    ],
    [common, states, stateWord],
  );
  return (
    <ClientDataTable
      tableId="admin.billing-organizations"
      columns={columns}
      data={organizations}
      qualifiers={qualifiers}
      pills={pills}
      getSearchText={(row) => `${row.name} ${row.slug}`}
      getRowId={(row) => row.organizationId}
      emptyText={t("empty")}
    />
  );
}
