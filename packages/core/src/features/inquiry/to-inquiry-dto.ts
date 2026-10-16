import type { Inquiry } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { InquiryDto } from "./schema";

export type ToInquiryDtoInput = { row: Inquiry };

export const toInquiryDto = ({ row }: ToInquiryDtoInput): InquiryDto => ({
  ...row,
  fields: asFieldValues({ value: row.fields }),
});

export type LoadInquiryInput = { context: Pick<OperationContext, "db">; id: string };

/** The active inquiry, or null when missing, archived or in another organization. */
export async function loadInquiry({ context, id }: LoadInquiryInput): Promise<InquiryDto | null> {
  const row = await context.db.inquiry.findFirst({ where: { id } });
  return row ? toInquiryDto({ row }) : null;
}
