"use client";

import type { StripeInvoice } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useStripeInvoiceColumns } from "./use-stripe-invoice-columns";

export type StripeInvoicesTableProps = {
  invoices: StripeInvoice[];
};

export function StripeInvoicesTable({ invoices }: StripeInvoicesTableProps) {
  const t = useTranslations("admin.billing.financials.invoices");
  const columns = useStripeInvoiceColumns();

  return (
    <PersistedDataTable
      tableId="admin.billing-invoices"
      columns={columns}
      data={invoices}
      getRowId={(row) => row.id}
      emptyText={t("empty")}
    />
  );
}
