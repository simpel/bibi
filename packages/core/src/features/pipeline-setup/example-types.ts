import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import type { EntityBase } from "../entity-type/capability-kinds";
import { createEntityType } from "../entity-type/write-operations";
import type { PipelineCreateExamplesInput } from "./examples-schema";

/** The type ids an example order needs, one per base. */
export type ExampleTypeIds = { customer: string; contact: string; order: string; line: string };

type BaseInput = { context: OperationContext; base: EntityBase; name: string };

/** The organization's first active type of `base`, else a new one named `name`. */
async function typeOfBase({ context, base, name }: BaseInput): Promise<Result<string>> {
  const found = await context.db.entityType.findFirst({
    where: { base },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (found) return ok({ value: found.id });
  const created = await runNested({ operation: createEntityType, input: { base, name }, context });
  return created.ok ? ok({ value: created.value.id }) : created;
}

export type EnsureExampleTypesInput = {
  context: OperationContext;
  names: PipelineCreateExamplesInput["typeNames"];
};

/** The customer, contact, order and line types: reused when present, created when missing. */
export async function ensureExampleTypes({
  context,
  names,
}: EnsureExampleTypesInput): Promise<Result<ExampleTypeIds>> {
  const customer = await typeOfBase({ context, base: "CUSTOMER", name: names.customer });
  if (!customer.ok) return customer;
  const contact = await typeOfBase({ context, base: "CONTACT", name: names.contact });
  if (!contact.ok) return contact;
  const order = await typeOfBase({ context, base: "ORDER", name: names.order });
  if (!order.ok) return order;
  const line = await typeOfBase({ context, base: "LINE", name: names.line });
  if (!line.ok) return line;
  return ok({
    value: {
      customer: customer.value,
      contact: contact.value,
      order: order.value,
      line: line.value,
    },
  });
}
