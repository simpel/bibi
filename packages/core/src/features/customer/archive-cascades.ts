import { appError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { archiveBooking } from "../booking/archive-booking";
import { toBookingDto } from "../booking/to-booking-dto";
import { toInquiryDto } from "../inquiry/to-inquiry-dto";
import { toItemDtos } from "../item/to-item-dto";
import type { CustomerDto } from "./schema";

export type CascadeInput = { context: OperationContext; customer: CustomerDto };

type RequireInput = {
  context: OperationContext;
  permission: `${string}:${"read" | "write" | "admin"}`;
  what: string;
};

function requirePermission({ context, permission, what }: RequireInput): Result<true> {
  if (hasPermission({ permissions: context.permissions, permission })) return ok({ value: true });
  const message = `Missing permission ${permission} to archive the customer's ${what}`;
  return err({ error: appError({ code: "FORBIDDEN", message }) });
}

/** Archives every booking of the customer that is not archived, through `archiveBooking`. */
export async function archiveCustomerBookings({
  context,
  customer,
}: CascadeInput): Promise<Result<number>> {
  const allowed = requirePermission({ context, permission: "booking:write", what: "bookings" });
  if (!allowed.ok) return allowed;
  const rows = await context.db.booking.findMany({ where: { customerId: customer.id } });
  for (const row of rows) {
    const archived = await archiveBooking({ context, booking: toBookingDto({ row }) });
    if (!archived.ok) return archived;
  }
  return ok({ value: rows.length });
}

/** Archives every active inquiry of the customer; one audit row each. */
export async function archiveCustomerInquiries({
  context,
  customer,
}: CascadeInput): Promise<Result<number>> {
  const allowed = requirePermission({ context, permission: "inquiry:write", what: "inquiries" });
  if (!allowed.ok) return allowed;
  const rows = await context.db.inquiry.findMany({ where: { customerId: customer.id } });
  for (const row of rows) {
    const updated = await context.db.inquiry.update({
      where: { id: row.id },
      data: { status: "ARCHIVED" },
    });
    context.recordChange({
      entityType: "inquiry",
      entityId: row.id,
      before: toInquiryDto({ row }),
      after: toInquiryDto({ row: updated }),
    });
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
  const allowed = requirePermission({ context, permission: "item:write", what: "packages" });
  if (!allowed.ok) return allowed;
  const before = await toItemDtos({ context, rows });
  for (const dto of before) {
    const row = await context.db.item.update({
      where: { id: dto.id },
      data: { status: "ARCHIVED" },
    });
    const [after] = await toItemDtos({ context, rows: [row] });
    context.recordChange({ entityType: "item", entityId: dto.id, before: dto, after });
  }
  return ok({ value: rows.length });
}
