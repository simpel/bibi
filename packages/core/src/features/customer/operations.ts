import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { archiveCustomer } from "./archive-operation";
import {
  CustomerIdInputSchema,
  CustomerListInputSchema,
  CustomerListOutputSchema,
  CustomerSchema,
} from "./schema";
import { CUSTOMER_INCLUDE, loadCustomer, toCustomerDto } from "./to-customer-dto";
import { createCustomer, updateCustomer } from "./write-operations";

export const listCustomers = defineOperation({
  name: "customer.list",
  kind: "query",
  description:
    "List the organization's customers: the companies, agencies, associations or private " +
    "persons that buy. Filter by ids, customer type or part of the name.",
  input: CustomerListInputSchema,
  output: CustomerListOutputSchema,
  permission: "customer:view",
  handler: async ({ input, context }) => {
    const rows = await context.db.customer.findMany({
      where: {
        ...(input.ids ? { id: { in: input.ids } } : {}),
        ...(input.entityTypeId ? { entityTypeId: input.entityTypeId } : {}),
        ...(input.query ? { name: { contains: input.query, mode: "insensitive" as const } } : {}),
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: CUSTOMER_INCLUDE,
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = page.items.map((row) => toCustomerDto({ row, context }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getCustomer = defineOperation({
  name: "customer.get",
  kind: "query",
  description: "Get one customer by id, with invoice details and the type's field values.",
  input: CustomerIdInputSchema,
  output: CustomerSchema,
  permission: "customer:view",
  handler: async ({ input, context }) => {
    const customer = await loadCustomer({ context, id: input.id });
    return customer ? ok({ value: customer }) : notFound({ entity: "Customer" });
  },
});

export const customerOperations = [
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  archiveCustomer,
];
