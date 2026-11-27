"use client";

import { createTableColumns, statusColumn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ClientDataTable } from "@/components/data-table/client-data-table";

export type AccountCheck = "ok" | "attention" | "notChecked";

/** One account Bibi books to, with what the last check found for it at the accounting system. */
export type ProviderAccountRow = {
  id: string;
  /** What Bibi uses the account for, written on the server ("Deposits", "Revenue: Rooms"). */
  purpose: string;
  account: string;
  check: AccountCheck;
  /** What is wrong, in the user's language; empty unless `check` is `attention`. */
  problem: string;
};

const CHECK_COLORS: Record<AccountCheck, string> = {
  ok: "var(--success)",
  attention: "var(--warning)",
  notChecked: "var(--muted-foreground)",
};

export type ProviderAccountsTableProps = {
  rows: ProviderAccountRow[];
  /** The accounting system's name in the viewer's language. */
  name: string;
};

/** The accounts Bibi books to, next to whether each one works in the accounting system. */
export function ProviderAccountsTable({ rows, name }: ProviderAccountsTableProps) {
  const t = useTranslations("integration.accounts");
  const columns = useMemo(
    () =>
      createTableColumns<ProviderAccountRow>({
        primary: [
          {
            id: "purpose",
            header: t("columns.purpose"),
            accessorFn: (row) => row.purpose,
            cell: ({ row }) => (
              <span className="grid gap-0.5">
                <span className="font-medium">{row.original.purpose}</span>
                {row.original.problem ? (
                  <span className="whitespace-normal text-muted-foreground">
                    {row.original.problem}
                  </span>
                ) : null}
              </span>
            ),
          },
        ],
        relations: [
          {
            id: "account",
            header: t("columns.account"),
            accessorFn: (row) => row.account,
          },
        ],
        status: [
          statusColumn<ProviderAccountRow>({
            header: t("columns.inSystem", { name }),
            getStatus: (row) => ({
              label: t(`check.${row.check}`),
              color: CHECK_COLORS[row.check],
            }),
          }),
        ],
      }),
    [t, name],
  );
  return (
    <ClientDataTable
      tableId="integration.accounts"
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      getSearchText={(row) => `${row.purpose} ${row.account}`}
      emptyText={t("empty")}
    />
  );
}
