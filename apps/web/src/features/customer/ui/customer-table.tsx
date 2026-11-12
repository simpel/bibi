"use client";

import type { CustomerDto, EntityTypeDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { type QuickFilterPill, TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import { useRouter } from "@/lib/navigation";
import { customerRoute } from "@/lib/routes";
import { CustomerRowActions, CustomerRowMenu } from "./customer-row-actions";
import { useCustomerColumns } from "./use-customer-columns";

export type CustomerTableProps = {
  customers: CustomerDto[];
  types: EntityTypeDto[];
  canEdit?: boolean | undefined;
};

function useCustomerQualifiers({
  customers,
  types,
}: {
  customers: CustomerDto[];
  types: EntityTypeDto[];
}): TableQualifier<CustomerDto>[] {
  const t = useTranslations("customer.columns");
  return useMemo(
    () => [
      {
        key: "type",
        label: t("type"),
        hint: types.map((type) => type.name).join(", ") || t("type"),
        pick: (c) => types.find((type) => type.id === c.entityTypeId)?.name,
        options: types.map((type) => type.name),
      },
      {
        key: "city",
        label: t("city"),
        hint: t("city"),
        pick: (c) => c.invoiceCity,
        options: customers.flatMap((c) => (c.invoiceCity ? [c.invoiceCity] : [])),
      },
      {
        key: "email",
        label: t("email"),
        hint: t("email"),
        pick: (c) => c.email,
        options: customers.flatMap((c) => (c.email ? [c.email] : [])),
      },
    ],
    [t, customers, types],
  );
}

/** Customer rows: name (link to the detail page), type, city, email, value and sticky actions. */
export function CustomerTable({ customers, types, canEdit = false }: CustomerTableProps) {
  const t = useTranslations("customer");
  const common = useTranslations("common");
  const router = useRouter();
  const qualifiers = useCustomerQualifiers({ customers, types });
  const view = useClientTableView({
    rows: customers,
    qualifiers,
    getSearchText: (c) => `${c.name} ${c.invoiceCity ?? ""} ${c.email ?? ""}`,
    totalLabel: (count) => `${count}`,
  });
  const pills: QuickFilterPill[] = [
    { key: "all", label: common("readFilter.all"), query: undefined },
    ...types.map((type) => ({
      key: type.id,
      label: type.name,
      query: type.name.includes(" ") ? `type:"${type.name}"` : `type:${type.name}`,
    })),
  ];
  const columns = useCustomerColumns({
    types,
    renderActions: (customer) => <CustomerRowActions customer={customer} canEdit={canEdit} />,
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar
        q={view.q}
        query={view.query}
        pills={pills}
        onSelectPill={(next) => view.navigate({ patch: { q: next ?? null, page: null } })}
      />
      <PersistedDataTable
        tableId="customer"
        columns={columns}
        data={view.rows}
        getRowId={(customer) => customer.id}
        onRowClick={(customer) => router.push(customerRoute({ id: customer.id }))}
        rowMenu={(customer) => <CustomerRowMenu customer={customer} canEdit={canEdit} />}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
    </div>
  );
}
