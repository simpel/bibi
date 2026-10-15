import { ok, type Result } from "../../errors/result";
import { createContact } from "../../features/contact/write-operations";
import { createCustomer } from "../../features/customer/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoContact, DemoCustomer } from "./customer-types";
import type { DemoRefs } from "./demo-refs";
import { missing, resolveFields } from "./seed-fields";

export type SeedCustomersInput = {
  context: ExecuteContext;
  customers: readonly DemoCustomer[];
  refs: DemoRefs;
};

type ContactInput = Omit<SeedCustomersInput, "customers"> & {
  customerId: string;
  contact: DemoContact;
};

async function seedContact({ context, refs, customerId, contact }: ContactInput) {
  const type = refs.contactTypes.get(contact.type);
  if (!type) return missing({ what: `contact type ${contact.type}` });
  const fields = resolveFields({ fields: contact.fields, type });
  if (!fields.ok) return fields;
  const { type: _type, fields: _fields, ...data } = contact;
  const input = { ...data, customerId, entityTypeId: type.id, fields: fields.value };
  return execute({ operation: createContact, input, context });
}

type CustomerInput = Omit<SeedCustomersInput, "customers"> & { customer: DemoCustomer };

async function seedCustomer({ context, refs, customer }: CustomerInput): Promise<Result<true>> {
  const type = refs.customerTypes.get(customer.type);
  if (!type) return missing({ what: `customer type ${customer.type}` });
  const fields = resolveFields({ fields: customer.fields, type });
  if (!fields.ok) return fields;
  const { type: _type, fields: _fields, contacts, ...data } = customer;
  const input = { ...data, entityTypeId: type.id, fields: fields.value };
  const created = await execute({ operation: createCustomer, input, context });
  if (!created.ok) return created;
  for (const contact of contacts) {
    const result = await seedContact({ context, refs, customerId: created.value.id, contact });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}

/** Slice 4 of ADR 0025: customers and their contact persons, via `execute` as SYSTEM. */
export async function seedDemoCustomers({
  context,
  customers,
  refs,
}: SeedCustomersInput): Promise<Result<true>> {
  for (const customer of customers) {
    const result = await seedCustomer({ context, refs, customer });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
