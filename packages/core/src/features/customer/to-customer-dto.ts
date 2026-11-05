import type { Customer } from "@bibi/db";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { recordFields, WITH_RECORD_LINKS, type WithRecordLinks } from "../../records/record-links";
import type { CustomerDto } from "./schema";

/**
 * Prisma `include` for every customer read: counts the orders that are not archived. The
 * composite foreign key (`customerId`, `organizationId`) keeps them in the customer's organization.
 */
export const CUSTOMER_INCLUDE = {
  _count: { select: { orders: { where: { status: "ACTIVE" as const } } } },
  ...WITH_RECORD_LINKS,
};

export type CustomerRow = Customer & WithRecordLinks & { _count: { orders: number } };

export type ToCustomerDtoInput = {
  row: CustomerRow;
  /** The caller: `orderCount` is only filled when it may view orders (ADR 0050). */
  context: Pick<OperationContext, "permissions">;
};

export const toCustomerDto = ({ row, context }: ToCustomerDtoInput): CustomerDto => {
  const { _count, record: _record, ...customer } = row;
  const { permissions } = context;
  const ordersVisible = hasPermission({ permissions, permission: "order:read" });
  return {
    ...customer,
    fields: recordFields({ row }),
    orderCount: ordersVisible ? _count.orders : null,
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
