import type { Customer } from "@okazi/db";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { CustomerDto } from "./schema";

/**
 * Prisma `include` for every customer read: counts the tickets that are not archived. The
 * composite foreign key (`customerId`, `organizationId`) keeps them in the customer's organization.
 */
export const CUSTOMER_INCLUDE = {
  _count: { select: { tickets: { where: { status: "ACTIVE" as const } } } },
};

export type CustomerRow = Customer & { _count: { tickets: number } };

export type ToCustomerDtoInput = {
  row: CustomerRow;
  /** The caller: `ticketCount` is only filled when it may view tickets (ADR 0050). */
  context: Pick<OperationContext, "permissions">;
};

export const toCustomerDto = ({ row, context }: ToCustomerDtoInput): CustomerDto => {
  const { _count, ...customer } = row;
  const { permissions } = context;
  const ticketsVisible = hasPermission({ permissions, permission: "ticket:read" });
  return {
    ...customer,
    fields: asFieldValues({ value: row.fields }),
    ticketCount: ticketsVisible ? _count.tickets : null,
  };
};

export type LoadCustomerInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  id: string;
};

/** The active customer, or null when missing, archived or in another organization. */
export async function loadCustomer({
  context,
  id,
}: LoadCustomerInput): Promise<CustomerDto | null> {
  const row = await context.db.customer.findFirst({ where: { id }, include: CUSTOMER_INCLUDE });
  return row ? toCustomerDto({ row, context }) : null;
}
