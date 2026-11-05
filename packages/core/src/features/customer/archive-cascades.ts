import { appError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { Permission } from "../../operations/permission";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { archiveRecords } from "../../records/update-record";
import { checkItemsUnused } from "../item/archive-guard";
import { toItemDtos } from "../item/to-item-dto";
import { archiveOrder } from "../order/archive-order";
import { ORDER_INCLUDE, toOrderDto } from "../order/to-order-dto";
import { checkExpectedOrderCount } from "./archive-expected";
import type { CustomerDto } from "./schema";

export type CascadeInput = { context: OperationContext; customer: CustomerDto };

type RequireInput = {
  context: OperationContext;
  permission: Permission;
  what: string;
};

function requirePermission({ context, permission, what }: RequireInput): Result<true> {
  if (hasPermission({ permissions: context.permissions, permission })) return ok({ value: true });
  const message = `Missing permission ${permission} to archive the customer's ${what}`;
  return err({ error: appError({ code: "FORBIDDEN", message }) });
}

export type ArchiveOrdersInput = CascadeInput & { expected?: number | undefined };

/**
 * Archives every order of the customer that is not archived, through `archiveOrder`. With
 * `expected` (the count the approver saw, #144) the archive is refused before anything is
 * written unless exactly that many orders are archived, the same rows read here.
 */
export async function archiveCustomerOrders({
  context,
  customer,
  expected,
}: ArchiveOrdersInput): Promise<Result<number>> {
  const rows = await context.db.order.findMany({
    where: { customerId: customer.id },
    include: ORDER_INCLUDE,
  });
  if (rows.length > 0) {
    // Before the count check, so its message never describes orders the caller cannot remove.
    const allowed = requirePermission({ context, permission: "order:delete", what: "orders" });
    if (!allowed.ok) return allowed;
  }
  const changed = checkExpectedOrderCount({ name: customer.name, expected, actual: rows.length });
  if (changed) return changed;
  if (rows.length === 0) return ok({ value: 0 });
  for (const row of rows) {
    const archived = await archiveOrder({ context, order: toOrderDto({ row }) });
    if (!archived.ok) return archived;
  }
  return ok({ value: rows.length });
}

/** Archives the customer's own bundles (items with its `customerId`); one audit row each. */
export async function archiveCustomerBundles({
  context,
  customer,
}: CascadeInput): Promise<Result<number>> {
  const rows = await context.db.item.findMany({ where: { customerId: customer.id } });
  if (rows.length === 0) return ok({ value: 0 });
  const allowed = requirePermission({ context, permission: "item:delete", what: "bundles" });
  if (!allowed.ok) return allowed;
  const before = await toItemDtos({ context, rows });
  const unused = await checkItemsUnused({ context, items: before });
  if (!unused.ok) return unused;
  for (const dto of before) {
    const row = await context.db.item.update({
      where: { id: dto.id },
      data: { status: "ARCHIVED" },
    });
    await archiveRecords({ context, ids: [dto.id] });
    const [after] = await toItemDtos({ context, rows: [row] });
    context.recordChange({ entityType: "item", entityId: dto.id, before: dto, after });
  }
  return ok({ value: rows.length });
}
