import type { InquiryDto } from "@okazi/core";
import type { InquiryFormData } from "./inquiry-form-data";
import { InquiryTable } from "./inquiry-table";

export type InquiryListTableProps = { inquiries: InquiryDto[]; data: InquiryFormData };

/** Hands the client table only what it shows (plain lookups, no form schemas). */
export function InquiryListTable({ inquiries, data }: InquiryListTableProps) {
  return (
    <InquiryTable
      inquiries={inquiries}
      customers={data.customers}
      types={data.types.map(({ id, name }) => ({ id, name }))}
    />
  );
}
