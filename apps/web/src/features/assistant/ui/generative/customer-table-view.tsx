"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { customerRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type CustomerTableViewProps = GenerativeProps<"customer-table">;

/** A page of customers; each name links to the customer page. */
export function CustomerTableView({ items, nextCursor }: CustomerTableViewProps) {
  const t = useTranslations("assistant.ui.customer");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="customer-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.city")}</TableHead>
            <TableHead>{t("columns.email")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">
                <Link href={customerRoute({ id: customer.id })} className="hover:underline">
                  {customer.name}
                </Link>
              </TableCell>
              <TableCell>{customer.invoiceCity ?? "–"}</TableCell>
              <TableCell>{customer.email ?? "–"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
