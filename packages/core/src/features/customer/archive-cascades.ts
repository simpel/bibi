import { appError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { Permission } from "../../operations/permission";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { archiveRecords } from "../../records/update-record";
import { toItemDtos } from "../item/to-item-dto";
import { archiveTicket } from "../ticket/archive-ticket";
import { TICKET_INCLUDE, toTicketDto } from "../ticket/to-ticket-dto";
import { checkExpectedTicketCount } from "./archive-expected";
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

export type ArchiveTicketsInput = CascadeInput & { expected?: number | undefined };

/**
 * Archives every ticket of the customer that is not archived, through `archiveTicket`. With
 * `expected` (the count the approver saw, #144) the archive is refused before anything is
 * written unless exactly that many tickets are archived, the same rows read here.
 */
export async function archiveCustomerTickets({
  context,
  customer,
  expected,
}: ArchiveTicketsInput): Promise<Result<number>> {
  const rows = await context.db.ticket.findMany({
    where: { customerId: customer.id },
    include: TICKET_INCLUDE,
  });
  if (rows.length > 0) {
    // Before the count check, so its message never describes tickets the caller cannot remove.
    const allowed = requirePermission({ context, permission: "ticket:delete", what: "tickets" });
    if (!allowed.ok) return allowed;
  }
  const changed = checkExpectedTicketCount({ name: customer.name, expected, actual: rows.length });
  if (changed) return changed;
  if (rows.length === 0) return ok({ value: 0 });
  for (const row of rows) {
    const archived = await archiveTicket({ context, ticket: toTicketDto({ row }) });
    if (!archived.ok) return archived;
  }
  return ok({ value: rows.length });
}

/** Archives the customer's own packages (items with its `customerId`); one audit row each. */
export async function archiveCustomerPackages({
  context,
  customer,
}: CascadeInput): Promise<Result<number>> {
  const rows = await context.db.item.findMany({ where: { customerId: customer.id } });
  if (rows.length === 0) return ok({ value: 0 });
  const allowed = requirePermission({ context, permission: "item:delete", what: "packages" });
  if (!allowed.ok) return allowed;
  const before = await toItemDtos({ context, rows });
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
