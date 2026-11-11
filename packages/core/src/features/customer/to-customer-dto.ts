import type { Customer } from "@bibi/db";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { recordFields, WITH_RECORD_LINKS, type WithRecordLinks } from "../../records/record-links";
import { type CustomerValues, customerValues } from "./customer-values";
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
  /** From `customerValues`: `valueMinor` is null when it is null (no `payment:read`). */
  values: CustomerValues;
};

export const toCustomerDto = ({ row, context, values }: ToCustomerDtoInput): CustomerDto => {
  const { _count, record: _record, ...customer } = row;
  const { permissions } = context;
  const ordersVisible = hasPermission({ permissions, permission: "order:read" });
  return {
    ...customer,
    fields: recordFields({ row }),
    orderCount: ordersVisible ? _count.orders : null,
    valueMinor: values ? (values.get(row.id) ?? 0) : null,
  };
};

export type ToCustomerDtosInput = {
  rows: readonly CustomerRow[];
  context: Pick<OperationContext, "db" | "permissions">;
};

/** Customer rows as DTOs, with all their values read in one batch. */
export async function toCustomerDtos({ rows, context }: ToCustomerDtosInput) {
  const values = await customerValues({ context, customerIds: rows.map((row) => row.id) });
  return rows.map((row) => toCustomerDto({ row, context, values }));
}

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
  if (!row) return null;
  const [customer] = await toCustomerDtos({ rows: [row], context });
  return customer ?? null;
}
