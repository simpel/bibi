"use client";

import type { CustomerDto, EntityTypeDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useCustomerColumns } from "./use-customer-columns";

export type CustomerTableProps = { customers: CustomerDto[]; types: EntityTypeDto[] };

/** Customer rows: name (link to the detail page), type, city and email. */
export function CustomerTable({ customers, types }: CustomerTableProps) {
  const t = useTranslations("customer");
  const columns = useCustomerColumns({ types });
  return (
    <PersistedDataTable
      tableId="customer"
      columns={columns}
      data={customers}
      getRowId={(customer) => customer.id}
      emptyText={t("empty")}
    />
  );
}
