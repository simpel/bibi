import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkNotLinked } from "../field-definition/link-usage";
import {
  archiveCustomerBookings,
  archiveCustomerInquiries,
  archiveCustomerPackages,
} from "./archive-cascades";
import { customerEmbeddable } from "./embeddable";
import { CustomerArchiveInputSchema, type CustomerDto, CustomerSchema } from "./schema";
import { CUSTOMER_INCLUDE, loadCustomer, toCustomerDto } from "./to-customer-dto";

type NotLinkedInput = {
  context: OperationContext;
  customer: CustomerDto;
  bookings: boolean;
  inquiries: boolean;
};

const recordsOf = ({ rows }: { rows: { id: string; entityTypeId: string }[] }) =>
  rows.map(({ id, entityTypeId }) => ({ id, entityTypeId }));

/** The customer and everything archived with it must not be LINK targets (ADR 0026). */
async function checkCustomerNotLinked({ context, customer, bookings, inquiries }: NotLinkedInput) {
  const where = { customerId: customer.id };
  const select = { id: true, entityTypeId: true };
  const rows = [
    { id: customer.id, entityTypeId: customer.entityTypeId },
    ...(bookings ? recordsOf({ rows: await context.db.booking.findMany({ where, select }) }) : []),
    ...(inquiries ? recordsOf({ rows: await context.db.inquiry.findMany({ where, select }) }) : []),
    ...recordsOf({ rows: await context.db.item.findMany({ where, select }) }),
  ];
  return checkNotLinked({ context, records: rows, what: customer.name });
}

type InquiriesBlockInput = { name: string; count: number };

/** Every active inquiry blocks, like bookings, unless `archiveInquiries` cascades (#159). */
const inquiriesBlock = ({ name, count }: InquiriesBlockInput) =>
  conflict({
    message: `${name} has ${count} active inquiries; archive them first or set archiveInquiries`,
    issues: [
      {
        path: "archiveInquiries",
        message: `${count} inquiries block archiving; set archiveInquiries to archive them too`,
      },
    ],
  });

type CascadeFlags = { archiveBookings: boolean; archiveInquiries: boolean };
type CascadeArchiveInput = { context: OperationContext; customer: CustomerDto } & CascadeFlags;

/** Blocks on bookings and inquiries unless cascaded; always archives the customer's packages. */
async function cascadeArchive({ context, customer, ...flags }: CascadeArchiveInput) {
  if (customer.bookingCount > 0) {
    if (!flags.archiveBookings) return bookingsBlock({ customer });
    const archived = await archiveCustomerBookings({ context, customer });
    if (!archived.ok) return archived;
  }
  const inquiries = await context.db.inquiry.count({ where: { customerId: customer.id } });
  if (inquiries > 0) {
    if (!flags.archiveInquiries) return inquiriesBlock({ name: customer.name, count: inquiries });
    const archived = await archiveCustomerInquiries({ context, customer });
    if (!archived.ok) return archived;
  }
  return archiveCustomerPackages({ context, customer });
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
    "Archive (soft-delete) a customer. Refused while the customer has active contacts or " +
    "active price lists (archive those first). Every booking that is not archived, in any " +
    "status, also blocks it, unless `archiveBookings` is true: then those bookings are " +
    "archived with the customer, with their program items and room occupancy (needs " +
    "booking:write). Active inquiries block it too, unless `archiveInquiries` is true (needs " +
    "inquiry:write). The customer's own packages are archived with it (needs item:write). " +
    "Refused while a LINK field points to the customer or to anything archived with it.",
  input: CustomerArchiveInputSchema,
  output: CustomerSchema,
  permission: "customer:write",
  embeddable: customerEmbeddable,
  handler: async ({ input, context }) => {
    const { id, archiveBookings, archiveInquiries } = input;
    const before = await loadCustomer({ context, id });
    if (!before) return notFound({ entity: "Customer" });
    const contacts = await context.db.contact.count({ where: { customerId: id } });
    if (contacts > 0)
      return conflict({ message: `${before.name} has ${contacts} active contacts` });
    const priceLists = await context.db.priceList.count({ where: { customerId: id } });
    if (priceLists > 0)
      return conflict({ message: `${before.name} has ${priceLists} active price lists` });
    const flags = { bookings: archiveBookings, inquiries: archiveInquiries };
    const linked = await checkCustomerNotLinked({ context, customer: before, ...flags });
    if (!linked.ok) return linked;
    const cascaded = await cascadeArchive({
      context,
      customer: before,
      archiveBookings,
      archiveInquiries,
    });
    if (!cascaded.ok) return cascaded;
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
