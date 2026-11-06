import type { ScopedDbClient } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { loadZoneOfVenue } from "../../shared/time-zones";
import { atDaysAhead } from "../../time/days-ahead";
import { nowOf } from "../../time/now";
import { contactEmbeddable } from "../contact/embeddable";
import { customerEmbeddable } from "../customer/embeddable";
import { createCustomer } from "../customer/write-operations";
import { itemEmbeddable } from "../item/embeddable";
import { createOrder } from "../order/write-operations";
import { advanceExample, exampleAdvanceStatusId } from "./advance-example";
import { exampleLines } from "./example-lines";
import { type ExampleTypeIds, ensureExampleTypes } from "./example-types";
import type {
  ExampleOrder,
  PipelineCreateExamplesInput,
  PipelineCreateExamplesOutput,
} from "./examples-schema";

type Party = { customerId: string; contactId: string; assigneeId: string | null };

type CustomerInput = {
  context: OperationContext;
  customer: PipelineCreateExamplesInput["customer"];
  types: ExampleTypeIds;
};

/** The example customer with its contact person, through `customer.create`. */
async function exampleCustomer({ context, customer, types }: CustomerInput) {
  const input = {
    entityTypeId: types.customer,
    name: customer.name,
    contact: {
      entityTypeId: types.contact,
      name: customer.contactName,
      email: customer.contactEmail,
    },
  };
  const created = await runNested({ operation: createCustomer, input, context });
  if (!created.ok) return created;
  const contact = await context.db.contact.findFirstOrThrow({
    where: { customerId: created.value.id },
    select: { id: true },
  });
  return ok({ value: { customerId: created.value.id, contactId: contact.id } });
}

type OrderInput = {
  context: OperationContext;
  order: ExampleOrder;
  types: ExampleTypeIds;
  party: Party;
  timeZone: string;
};

/** One example order with its lines, in the entry status, through `order.create`. */
async function exampleOrder({ context, order, types, party, timeZone }: OrderInput) {
  const now = nowOf({ context });
  const span = { now, days: order.startsInDays, timeZone };
  const startsAt = atDaysAhead({ ...span, time: order.startTime });
  const endsAt = atDaysAhead({ ...span, time: order.endTime });
  const lineTypeId = types.line;
  const lines = await exampleLines({ context, lines: order.lines, lineTypeId, startsAt, endsAt });
  if (!lines.ok) return lines;
  const input = {
    entityTypeId: types.order,
    ...party,
    title: order.title,
    desiredStartsAt: startsAt,
    desiredEndsAt: endsAt,
    estimatedHeadcount: order.headcount,
    lines: lines.value,
  };
  const created = await runNested({ operation: createOrder, input, context });
  return created.ok ? ok({ value: created.value.id }) : created;
}

export type CreateExamplesInput = { context: OperationContext; input: PipelineCreateExamplesInput };

/**
 * `pipelineSetup.createExamples`: base types when missing, the example customer and its orders,
 * each optionally moved on one status, all through the normal operations in one transaction.
 */
export async function createExamples({
  context,
  input,
}: CreateExamplesInput): Promise<Result<PipelineCreateExamplesOutput>> {
  const types = await ensureExampleTypes({ context, names: input.typeNames });
  if (!types.ok) return types;
  const customer = await exampleCustomer({ context, customer: input.customer, types: types.value });
  if (!customer.ok) return customer;
  const { actor } = context;
  const person = actor.type === "user" || actor.type === "ai";
  const party = { ...customer.value, assigneeId: person ? actor.userId : null };
  const timeZone = (await loadZoneOfVenue({ context }))({ venue: null });
  const advanceTo = await exampleAdvanceStatusId({ context });
  const orderIds: string[] = [];
  for (const order of input.orders) {
    const orderInput = { context, order, types: types.value, party, timeZone };
    const created = await exampleOrder(orderInput);
    if (!created.ok) return created;
    orderIds.push(created.value);
    if (!order.advance || !advanceTo) continue;
    const moved = await advanceExample({ context, orderId: created.value, statusId: advanceTo });
    if (!moved.ok) return moved;
  }
  return ok({ value: { customerId: customer.value.customerId, orderIds } });
}

type IndexedInput = { output: PipelineCreateExamplesOutput; db: ScopedDbClient };

/** The searchable records the examples wrote: the customer, its contacts and the lines' items. */
export async function examplesIndexed({ output, db }: IndexedInput) {
  const { customerId, orderIds } = output;
  const contacts = await db.contact.findMany({ where: { customerId }, select: { id: true } });
  const lines = await db.line.findMany({
    where: { orderId: { in: orderIds }, itemId: { not: null } },
    select: { itemId: true },
  });
  const itemIds = [...new Set(lines.flatMap(({ itemId }) => (itemId ? [itemId] : [])))];
  return [
    { embeddable: customerEmbeddable, ids: [customerId] },
    { embeddable: contactEmbeddable, ids: contacts.map(({ id }) => id) },
    { embeddable: itemEmbeddable, ids: itemIds },
  ];
}
