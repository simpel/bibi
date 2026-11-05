"use client";

import type { StripeInvoice } from "@bibi/core/schemas";
import {
  actionsColumn,
  Button,
  type ColumnDef,
  createTableColumns,
  dateColumn,
  numberColumn,
  statusColumn,
} from "@bibi/ui";
import { ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";

type Column = ColumnDef<StripeInvoice>;

function invoiceStatusColor({ status }: { status: string | null | undefined }): string {
  if (status === "paid") return "var(--success)";
  if (status === "open") return "var(--warning)";
  if (status === "uncollectible" || status === "void") return "var(--destructive)";
  return "var(--muted-foreground)";
}

export function useStripeInvoiceColumns(): Column[] {
  const t = useTranslations("admin.billing.financials.invoices");
  const common = useTranslations("common");
  const numbers = useNumberFormat();
  const format = useDateTimeFormat();

  return useMemo(
    () =>
      createTableColumns<StripeInvoice>({
        primary: [
          {
            id: "invoice",
            header: t("columns.invoice"),
            accessorFn: (row) => row.number || row.id,
            cell: ({ row }) => (
              <span className="font-medium">{row.original.number || row.original.id}</span>
            ),
          },
        ],
        relations: [
          {
            id: "customer",
            header: t("columns.customer"),
            accessorFn: (row) => row.customerName || row.customerEmail || "",
            cell: ({ row }) => (
              <span className="max-w-[200px] truncate">
                {row.original.customerName || row.original.customerEmail || "–"}
              </span>
            ),
          },
        ],
        status: [
          statusColumn<StripeInvoice>({
            header: t("columns.status"),
            getStatus: (row) =>
              row.status
                ? { label: row.status, color: invoiceStatusColor({ status: row.status }) }
                : null,
          }),
        ],
        dates: [
          dateColumn<StripeInvoice>({
            id: "date",
            header: t("columns.date"),
            getSortValue: (row) => new Date(row.created).getTime(),
            cell: (row) => format.date({ instant: row.created }),
          }),
        ],
        numbers: [
          numberColumn<StripeInvoice>({
            id: "amount",
            header: t("columns.amount"),
            getValue: (row) => row.amountPaid || row.amountDue,
            cell: (row) =>
              numbers.money({
                minor: row.amountPaid || row.amountDue,
                currency: row.currency,
              }),
          }),
        ],
        actions: [
          actionsColumn<StripeInvoice>({
            label: common("actions"),
            cell: (invoice) =>
              invoice.hostedInvoiceUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={invoice.hostedInvoiceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span>{t("view")}</span>
                    <ExternalLinkIcon className="size-3" />
                  </a>
                </Button>
              ) : null,
          }),
        ],
      }),
    [t, common, numbers, format],
  );
}
