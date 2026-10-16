"use client";

import { Link } from "@okazi/i18n/navigation";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { desiredPeriod } from "@/features/inquiry/ui/desired-period";
import { InquiryStatusBadge } from "@/features/inquiry/ui/inquiry-status-badge";
import { inquiryRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

import { MoreHint } from "./more-hint";

export type InquiryTableViewProps = GenerativeProps<"inquiry-table">;

/** A page of inquiries; each row links to the inquiry page. */
export function InquiryTableView({ items, nextCursor }: InquiryTableViewProps) {
  const t = useTranslations("assistant.ui.inquiry");
  const format = useFormatter();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="inquiry-table" className="overflow-hidden shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.created")}</TableHead>
            <TableHead>{t("columns.when")}</TableHead>
            <TableHead>{t("columns.quantity")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((inquiry) => (
            <TableRow key={inquiry.id}>
              <TableCell className="font-medium">
                <Link href={inquiryRoute({ id: inquiry.id })} className="hover:underline">
                  {format.dateTime(new Date(inquiry.createdAt), { dateStyle: "medium" })}
                </Link>
              </TableCell>
              <TableCell>{desiredPeriod({ format, inquiry })}</TableCell>
              <TableCell>{inquiry.quantity ?? "–"}</TableCell>
              <TableCell>
                <InquiryStatusBadge status={inquiry.inquiryStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
