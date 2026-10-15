"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { customerRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type ContactTableViewProps = GenerativeProps<"contact-table">;

/** A page of contact persons; each name links to the customer's page, where they are edited. */
export function ContactTableView({ items, nextCursor }: ContactTableViewProps) {
  const t = useTranslations("assistant.ui.contact");
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="contact-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.email")}</TableHead>
            <TableHead>{t("columns.phone")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">
                <Link href={customerRoute({ id: contact.customerId })} className="hover:underline">
                  {contact.name}
                </Link>
              </TableCell>
              <TableCell>{contact.email ?? "–"}</TableCell>
              <TableCell>{contact.phone ?? "–"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
