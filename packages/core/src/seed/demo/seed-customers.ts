import { ok, type Result } from "../../errors/result";
import { createContact } from "../../features/contact/write-operations";
import { createCustomer } from "../../features/customer/write-operations";
import { saveItemAsPackage } from "../../features/item/package-operations";
import { createPriceList } from "../../features/price-list/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoContact, DemoCustomer } from "./customer-types";
import type { DemoRefs } from "./demo-refs";
import { missing, resolveFields } from "./seed-fields";
import { itemInput } from "./seed-item-input";
import type { DemoCatalog } from "./seed-items";

export type SeedCustomersInput = {
  context: ExecuteContext;
  customers: readonly DemoCustomer[];
  refs: DemoRefs;
  catalog: DemoCatalog;
};

type ContactInput = Pick<SeedCustomersInput, "context" | "refs"> & {
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
type PackagesInput = CustomerInput & { customerId: string };

/** The customer's own packages via `item.saveAsPackage`, parts from the catalog by name. */
async function seedPackages({
  context,
  refs,
  catalog,
  customer,
  customerId,
}: PackagesInput): Promise<Result<true>> {
  for (const item of customer.packages ?? []) {
    const { venueId, items: seeded } = catalog;
    const input = itemInput({ item, refs, venueId, seeded });
    if (!input.ok) return input;
    const result = await execute({
      operation: saveItemAsPackage,
      input: { ...input.value, customerId, components: input.value.components ?? [] },
      context,
    });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}

async function seedCustomer({
  context,
  refs,
  catalog,
  customer,
}: CustomerInput): Promise<Result<true>> {
  const type = refs.customerTypes.get(customer.type);
  if (!type) return missing({ what: `customer type ${customer.type}` });
  const fields = resolveFields({ fields: customer.fields, type });
  if (!fields.ok) return fields;
  const { type: _type, fields: _fields, contacts, priceList, packages: _p, ...data } = customer;
  const input = { ...data, entityTypeId: type.id, fields: fields.value };
  const created = await execute({ operation: createCustomer, input, context });
  if (!created.ok) return created;
  for (const contact of contacts) {
    const result = await seedContact({ context, refs, customerId: created.value.id, contact });
    if (!result.ok) return result;
  }
  if (priceList) {
    const input = { ...priceList, customerId: created.value.id };
    const result = await execute({ operation: createPriceList, input, context });
    if (!result.ok) return result;
  }
  return seedPackages({ context, refs, catalog, customer, customerId: created.value.id });
}

/**
 * Slice 4 of ADR 0025: customers, their contact persons, price lists and own packages, via
 * `execute` as SYSTEM.
 */
export async function seedDemoCustomers({
  customers,
  ...rest
}: SeedCustomersInput): Promise<Result<true>> {
  for (const customer of customers) {
    const result = await seedCustomer({ ...rest, customer });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
