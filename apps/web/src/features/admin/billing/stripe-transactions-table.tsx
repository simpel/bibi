"use client";

import type { StripeBalanceTransaction } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useStripeTransactionColumns } from "./use-stripe-transaction-columns";

export type StripeTransactionsTableProps = {
  transactions: StripeBalanceTransaction[];
};

export function StripeTransactionsTable({ transactions }: StripeTransactionsTableProps) {
  const t = useTranslations("admin.billing.financials.transactions");
  const columns = useStripeTransactionColumns();

  return (
    <PersistedDataTable
      tableId="admin.billing-transactions"
      columns={columns}
      data={transactions}
      getRowId={(row) => row.id}
      emptyText={t("empty")}
    />
  );
}
