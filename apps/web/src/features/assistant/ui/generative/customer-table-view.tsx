"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useCustomerColumns } from "@/features/customer/ui/use-customer-columns";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type CustomerTableViewProps = GenerativeProps<"customer-table">;

/** A page of customers; each name links to the customer page. */
export function CustomerTableView({ items, nextCursor }: CustomerTableViewProps) {
  const t = useTranslations("assistant.ui.customer");
  const columns = useCustomerColumns({});
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="customer-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="customer"
        columns={columns}
        data={items}
        getRowId={(customer) => customer.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
