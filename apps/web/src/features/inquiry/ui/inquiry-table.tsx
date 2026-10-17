"use client";

import type { InquiryDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { type InquiryLookups, useInquiryColumns } from "./use-inquiry-columns";

export type InquiryTableProps = InquiryLookups & { inquiries: InquiryDto[] };

/** Inquiry rows: customer (link), type, salesperson, status, desired dates and quantity. */
export function InquiryTable({ inquiries, ...lookups }: InquiryTableProps) {
  const t = useTranslations("inquiry");
  const columns = useInquiryColumns(lookups);
  return (
    <PersistedDataTable
      tableId="inquiry.list"
      columns={columns}
      data={inquiries}
      getRowId={(inquiry) => inquiry.id}
      emptyText={t("empty")}
    />
  );
}
