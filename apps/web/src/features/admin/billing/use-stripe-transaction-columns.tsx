"use client";

import type { StripeBalanceTransaction } from "@bibi/core/schemas";
import {
  type ColumnDef,
  createTableColumns,
  dateColumn,
  numberColumn,
  statusColumn,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";

type Column = ColumnDef<StripeBalanceTransaction>;

function statusColor({ status }: { status: string }): string {
  if (status === "available") return "var(--success)";
  if (status === "pending") return "var(--warning)";
  return "var(--muted-foreground)";
}

export function useStripeTransactionColumns(): Column[] {
  const t = useTranslations("admin.billing.financials.transactions");
  const numbers = useNumberFormat();
  const format = useDateTimeFormat();
  return useMemo(
    () =>
      createTableColumns<StripeBalanceTransaction>({
        primary: [
          {
            id: "description",
            header: t("columns.description"),
            accessorFn: (row) => row.description ?? "",
            cell: ({ row }) => (
              <span className="max-w-[240px] truncate font-medium">
                {row.original.description || "–"}
              </span>
            ),
          },
        ],
        relations: [
          {
            id: "type",
            header: t("columns.type"),
            accessorFn: (row) => row.type,
            cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
          },
        ],
        status: [
          statusColumn<StripeBalanceTransaction>({
            header: t("columns.status"),
            getStatus: (row) => ({
              label: row.status,
              color: statusColor({ status: row.status }),
            }),
          }),
        ],
        dates: [
          dateColumn<StripeBalanceTransaction>({
            id: "date",
            header: t("columns.date"),
            getSortValue: (row) => new Date(row.created).getTime(),
            cell: (row) => format.date({ instant: row.created }),
          }),
        ],
        numbers: [
          numberColumn<StripeBalanceTransaction>({
            id: "gross",
            header: t("columns.gross"),
            getValue: (row) => row.amount,
            cell: (row) => numbers.money({ minor: row.amount, currency: row.currency }),
          }),
          numberColumn<StripeBalanceTransaction>({
            id: "fee",
            header: t("columns.fee"),
            getValue: (row) => row.fee,
            cell: (row) => (
              <span className="text-muted-foreground">
                {numbers.money({ minor: row.fee, currency: row.currency })}
              </span>
            ),
          }),
          numberColumn<StripeBalanceTransaction>({
            id: "net",
            header: t("columns.net"),
            getValue: (row) => row.net,
            cell: (row) => (
              <span className="font-medium">
                {numbers.money({ minor: row.net, currency: row.currency })}
              </span>
            ),
          }),
        ],
      }),
    [t, numbers, format],
  );
}
