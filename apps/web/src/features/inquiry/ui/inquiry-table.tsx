import type { InquiryDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getFormatter, getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { inquiryRoute } from "@/lib/routes";
import { desiredPeriod } from "./desired-period";
import type { InquiryFormData } from "./inquiry-form-data";
import { InquiryStatusBadge } from "./inquiry-status-badge";

export type InquiryTableProps = { inquiries: InquiryDto[]; data: InquiryFormData };

/** Inquiry rows: customer (link), type, desired dates, quantity, status and salesperson. */
export async function InquiryTable({ inquiries, data }: InquiryTableProps) {
  const t = await getTranslations("inquiry");
  const format = await getFormatter();
  const types = data.types.map(({ id, name }) => ({ id, name }));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.customer")}</TableHead>
          <TableHead>{t("columns.type")}</TableHead>
          <TableHead>{t("columns.when")}</TableHead>
          <TableHead>{t("columns.quantity")}</TableHead>
          <TableHead>{t("columns.status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inquiries.map((inquiry) => (
          <TableRow key={inquiry.id}>
            <TableCell className="font-medium">
              <Link href={inquiryRoute({ id: inquiry.id })} className="hover:underline">
                {nameOf({ options: data.customers, id: inquiry.customerId })}
              </Link>
            </TableCell>
            <TableCell>{nameOf({ options: types, id: inquiry.entityTypeId })}</TableCell>
            <TableCell>{desiredPeriod({ inquiry, format })}</TableCell>
            <TableCell>{inquiry.quantity ?? "–"}</TableCell>
            <TableCell>
              <InquiryStatusBadge status={inquiry.inquiryStatus} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
