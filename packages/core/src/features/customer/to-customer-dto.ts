import type { Customer } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { recordFields, WITH_RECORD_LINKS, type WithRecordLinks } from "../../records/record-links";
import type { CustomerDto } from "./schema";

/**
 * Prisma `include` for every customer read: counts the tickets that are not archived. The
 * composite foreign key (`customerId`, `organizationId`) keeps them in the customer's organization.
 */
export const CUSTOMER_INCLUDE = {
  _count: { select: { tickets: { where: { status: "ACTIVE" as const } } } },
  ...WITH_RECORD_LINKS,
};

export type CustomerRow = Customer & WithRecordLinks & { _count: { tickets: number } };

export type ToCustomerDtoInput = { row: CustomerRow };

export const toCustomerDto = ({ row }: ToCustomerDtoInput): CustomerDto => {
  const { _count, record: _record, ...customer } = row;
  return {
    ...customer,
    fields: recordFields({ row }),
    ticketCount: _count.tickets,
  };
};

export type LoadCustomerInput = { context: Pick<OperationContext, "db">; id: string };

/** The active customer, or null when missing, archived or in another organization. */
export async function loadCustomer({
  context,
  id,
}: LoadCustomerInput): Promise<CustomerDto | null> {
  const row = await context.db.customer.findFirst({ where: { id }, include: CUSTOMER_INCLUDE });
  return row ? toCustomerDto({ row }) : null;
}
