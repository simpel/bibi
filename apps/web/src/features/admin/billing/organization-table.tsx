"use client";

import type { BillingOrganizationDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useBillingOrganizationColumns } from "./use-billing-organization-columns";

export type OrganizationTableProps = { organizations: BillingOrganizationDto[] };

/** Every organization's billing: state, trial, plan, and the superadmin's two levers. */
export function OrganizationTable({ organizations }: OrganizationTableProps) {
  const t = useTranslations("admin.billing.organizations");
  const columns = useBillingOrganizationColumns();
  return (
    <PersistedDataTable
      tableId="admin.billing-organizations"
      columns={columns}
      data={organizations}
      getRowId={(row) => row.organizationId}
      emptyText={t("empty")}
    />
  );
}
