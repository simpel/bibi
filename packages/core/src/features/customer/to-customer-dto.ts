import type { Customer } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { CustomerDto } from "./schema";

/**
 * Prisma `include` for every customer read: counts the bookings that are not archived. The
 * composite foreign key (`customerId`, `organizationId`) keeps them in the customer's organization.
 */
export const CUSTOMER_INCLUDE = {
  _count: { select: { bookings: { where: { status: "ACTIVE" as const } } } },
};

export type CustomerRow = Customer & { _count: { bookings: number } };

export type ToCustomerDtoInput = { row: CustomerRow };

export const toCustomerDto = ({ row }: ToCustomerDtoInput): CustomerDto => {
  const { _count, ...customer } = row;
  return {
    ...customer,
    fields: asFieldValues({ value: row.fields }),
    bookingCount: _count.bookings,
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
