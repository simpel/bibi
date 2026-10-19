import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkNotLinked } from "../field-definition/link-usage";
import { archiveCustomerPackages, archiveCustomerTickets } from "./archive-cascades";
import { customerEmbeddable } from "./embeddable";
import { CustomerArchiveInputSchema, type CustomerDto, CustomerSchema } from "./schema";
import { CUSTOMER_INCLUDE, loadCustomer, toCustomerDto } from "./to-customer-dto";

type NotLinkedInput = {
  context: OperationContext;
  customer: CustomerDto;
  tickets: boolean;
};

const recordsOf = ({ rows }: { rows: { id: string; entityTypeId: string }[] }) =>
  rows.map(({ id, entityTypeId }) => ({ id, entityTypeId }));

/** The customer and everything archived with it must not be LINK targets (ADR 0026). */
async function checkCustomerNotLinked({ context, customer, tickets }: NotLinkedInput) {
  const where = { customerId: customer.id };
  const select = { id: true, entityTypeId: true };
  const rows = [
    { id: customer.id, entityTypeId: customer.entityTypeId },
    ...(tickets ? recordsOf({ rows: await context.db.ticket.findMany({ where, select }) }) : []),
    ...recordsOf({ rows: await context.db.item.findMany({ where, select }) }),
  ];
  return checkNotLinked({ context, records: rows, what: customer.name });
}

type CascadeFlags = {
  archiveTickets: boolean;
  expectedTicketCount?: number | undefined;
};
type CascadeArchiveInput = { context: OperationContext; customer: CustomerDto } & CascadeFlags;

/** Blocks on tickets unless cascaded; always archives the customer's packages. */
async function cascadeArchive({ context, customer, ...flags }: CascadeArchiveInput) {
  if (flags.archiveTickets) {
    const expected = flags.expectedTicketCount;
    const archived = await archiveCustomerTickets({ context, customer, expected });
    if (!archived.ok) return archived;
  } else if (customer.ticketCount > 0) return ticketsBlock({ customer });
  return archiveCustomerPackages({ context, customer });
}

type BlockedInput = { customer: CustomerDto };

/** Every ticket that is not archived blocks, whatever its phase (#134). */
const ticketsBlock = ({ customer: { name, ticketCount } }: BlockedInput) =>
  conflict({
    message: `${name} has ${ticketCount} tickets that are not archived; archive them first or set archiveTickets`,
    issues: [
      {
        path: "archiveTickets",
        message: `${ticketCount} tickets block archiving; set archiveTickets to archive them too`,
      },
    ],
  });

export const archiveCustomer = defineOperation({
  name: "customer.archive",
  kind: "command",
  description:
    "Archive (soft-delete) a customer. Refused while the customer has active contacts or " +
    "active price lists (archive those first). Every ticket that is not archived, in any " +
    "phase, also blocks it, unless `archiveTickets` is true: then those tickets are " +
    "archived with the customer, with their lines and room occupancy (needs " +
    "ticket:write). The customer's own packages are archived with it (needs item:write). " +
    "With `archiveTickets` and `expectedTicketCount` it is refused with CONFLICT, and nothing " +
    "is archived, unless exactly that many tickets would be archived. " +
    "Refused while a LINK field points to the customer or to anything archived with it.",
  input: CustomerArchiveInputSchema,
  output: CustomerSchema,
  permission: "customer:write",
  embeddable: customerEmbeddable,
  handler: async ({ input, context }) => {
    const { id, archiveTickets, expectedTicketCount } = input;
    const before = await loadCustomer({ context, id });
    if (!before) return notFound({ entity: "Customer" });
    const contacts = await context.db.contact.count({ where: { customerId: id } });
    if (contacts > 0)
      return conflict({ message: `${before.name} has ${contacts} active contacts` });
    const priceLists = await context.db.priceList.count({ where: { customerId: id } });
    if (priceLists > 0)
      return conflict({ message: `${before.name} has ${priceLists} active price lists` });
    const tickets = archiveTickets;
    const linked = await checkCustomerNotLinked({ context, customer: before, tickets });
    if (!linked.ok) return linked;
    const cascaded = await cascadeArchive({
      context,
      customer: before,
      archiveTickets,
      expectedTicketCount,
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
