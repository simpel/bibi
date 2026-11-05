import { appError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { archiveCustomer } from "./archive-operation";
import { findSimilarCustomers } from "./find-similar-operation";
import { recentCustomers } from "./recent-customers";
import {
  CustomerIdInputSchema,
  type CustomerListInput,
  CustomerListInputSchema,
  CustomerListOutputSchema,
  CustomerSchema,
} from "./schema";
import { CUSTOMER_INCLUDE, type CustomerRow, loadCustomer, toCustomerDto } from "./to-customer-dto";
import { createCustomer, updateCustomer } from "./write-operations";

type ListInput = { input: CustomerListInput; context: OperationContext };

/** The rows of one page: by name, or by latest order with `recent` (ADR 0081). */
async function listRows({ input, context }: ListInput): Promise<CustomerRow[]> {
  const where = {
    ...(input.ids ? { id: { in: input.ids } } : {}),
    ...(input.entityTypeId ? { entityTypeId: input.entityTypeId } : {}),
    ...(input.query ? { name: { contains: input.query, mode: "insensitive" as const } } : {}),
  };
  if (input.recent) return recentCustomers({ context, where, input });
  return context.db.customer.findMany({
    where,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    include: CUSTOMER_INCLUDE,
    ...pageArgs(input),
  });
}

const recentForbidden = () =>
  err({
    error: appError({
      code: "FORBIDDEN",
      message: "Missing permission order:read to order customers by their latest order",
    }),
  });

export const listCustomers = defineOperation({
  name: "customer.list",
  kind: "query",
  description:
    "List the organization's customers: the companies, agencies, associations or private " +
    "persons that buy. Filter by ids, customer type or part of the name. With `recent`, the " +
    "customers with orders, the latest booked first.",
  input: CustomerListInputSchema,
  output: CustomerListOutputSchema,
  permission: "customer:read",
  handler: async ({ input, context }) => {
    const { permissions } = context;
    if (input.recent && !hasPermission({ permissions, permission: "order:read" })) {
      return recentForbidden();
    }
    const rows = await listRows({ input, context });
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
  permission: "customer:read",
  handler: async ({ input, context }) => {
    const customer = await loadCustomer({ context, id: input.id });
    return customer ? ok({ value: customer }) : notFound({ entity: "Customer" });
  },
});

export const customerOperations = [
  listCustomers,
  getCustomer,
  findSimilarCustomers,
  createCustomer,
  updateCustomer,
  archiveCustomer,
];

export { findSimilarCustomers };
