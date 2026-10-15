import { appError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { toBookingDto } from "../booking/to-booking-dto";
import { checkNotLinked } from "../field-definition/link-usage";
import { customerEmbeddable } from "./embeddable";
import { CustomerArchiveInputSchema, type CustomerDto, CustomerSchema } from "./schema";
import { CUSTOMER_INCLUDE, loadCustomer, toCustomerDto } from "./to-customer-dto";

type CascadeInput = { context: OperationContext; customer: CustomerDto };

/** Archives every booking of the customer that is not archived; one audit row each. */
async function archiveBookings({ context, customer }: CascadeInput): Promise<Result<number>> {
  if (!hasPermission({ permissions: context.permissions, permission: "booking:write" })) {
    const message = "Missing permission booking:write to archive the customer's bookings";
    return err({ error: appError({ code: "FORBIDDEN", message }) });
  }
  const where = { customerId: customer.id };
  const before = await context.db.booking.findMany({ where });
  const rows = await context.db.booking.updateManyAndReturn({
    where: { ...where, id: { in: before.map(({ id }) => id) } },
    data: { status: "ARCHIVED" },
  });
  const byId = new Map(before.map((row) => [row.id, toBookingDto({ row })]));
  for (const row of rows) {
    const after = toBookingDto({ row });
    context.recordChange({
      entityType: "booking",
      entityId: row.id,
      before: byId.get(row.id),
      after,
    });
  }
  return ok({ value: rows.length });
}

type NotLinkedInput = CascadeInput & { cascade: boolean | undefined };

/** The customer, and the bookings archived with it, must not be LINK targets (ADR 0026). */
async function checkCustomerNotLinked({ context, customer, cascade }: NotLinkedInput) {
  const bookings = cascade
    ? await context.db.booking.findMany({
        where: { customerId: customer.id },
        select: { id: true, entityTypeId: true },
      })
    : [];
  const records = [{ id: customer.id, entityTypeId: customer.entityTypeId }, ...bookings];
  return checkNotLinked({ context, records, what: customer.name });
}

type BlockedInput = { customer: CustomerDto };

/** Every booking that is not archived blocks, whatever its status phase (#134). */
const bookingsBlock = ({ customer: { name, bookingCount } }: BlockedInput) =>
  conflict({
    message: `${name} has ${bookingCount} bookings that are not archived; archive them first or set archiveBookings`,
    issues: [
      {
        path: "archiveBookings",
        message: `${bookingCount} bookings block archiving; set archiveBookings to archive them too`,
      },
    ],
  });

export const archiveCustomer = defineOperation({
  name: "customer.archive",
  kind: "command",
  description:
    "Archive (soft-delete) a customer. Refused while the customer has active contacts. Every " +
    "booking that is not archived, in any status, also blocks it, unless `archiveBookings` is " +
    "true: then those bookings are archived with the customer (needs booking:write). Refused " +
    "while a LINK field points to the customer or to one of those bookings.",
  input: CustomerArchiveInputSchema,
  output: CustomerSchema,
  permission: "customer:write",
  embeddable: customerEmbeddable,
  handler: async ({ input: { id, archiveBookings: cascade }, context }) => {
    const before = await loadCustomer({ context, id });
    if (!before) return notFound({ entity: "Customer" });
    const contacts = await context.db.contact.count({ where: { customerId: id } });
    if (contacts > 0)
      return conflict({ message: `${before.name} has ${contacts} active contacts` });
    const linked = await checkCustomerNotLinked({ context, customer: before, cascade });
    if (!linked.ok) return linked;
    if (before.bookingCount > 0) {
      if (!cascade) return bookingsBlock({ customer: before });
      const archived = await archiveBookings({ context, customer: before });
      if (!archived.ok) return archived;
    }
    const row = await context.db.customer.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: CUSTOMER_INCLUDE,
    });
    const customer = toCustomerDto({ row });
    context.recordChange({ entityType: "customer", entityId: id, before, after: customer });
    return ok({ value: customer });
  },
});
