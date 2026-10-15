import type { ExecuteContext } from "../../operations/context";
import { getTemplateListSize } from "./template-size";
import type { DemoOrg } from "./types";

export type CheckDemoConfigInput = { context: ExecuteContext; org: DemoOrg };

type Count = { what: string; actual: number; expected: number };

/** Slices 4–5: customers, their contact persons and the bookings. */
async function customerCounts({ context, org }: CheckDemoConfigInput): Promise<Count[]> {
  const contacts = org.customers.reduce((sum, customer) => sum + customer.contacts.length, 0);
  return [
    {
      what: "customers",
      actual: await context.db.customer.count(),
      expected: org.customers.length,
    },
    { what: "contacts", actual: await context.db.contact.count(), expected: contacts },
    { what: "bookings", actual: await context.db.booking.count(), expected: org.bookings.length },
  ];
}

/** What the data files say slice 2 creates, per entity (check 1 in `docs/demo-seed.md`). */
async function counts({ context, org }: CheckDemoConfigInput): Promise<Count[]> {
  const { config } = org;
  const { db } = context;
  const sum = ({ values }: { values: number[] }) => values.reduce((a, b) => a + b, 0);
  const templateValues = sum({
    values: config.listTemplates.map((key) => getTemplateListSize({ key })),
  });
  return [
    { what: "venues", actual: await db.venue.count(), expected: 1 },
    {
      what: "lists",
      actual: await db.vocabulary.count(),
      expected: config.lists.length + config.listTemplates.length,
    },
    {
      what: "list values",
      actual: await db.vocabularyValue.count(),
      expected: templateValues + sum({ values: config.lists.map((list) => list.values.length) }),
    },
    { what: "setups", actual: await db.setup.count(), expected: config.setups.length },
    { what: "types", actual: await db.entityType.count(), expected: config.types.length },
    {
      what: "fields",
      actual: await db.fieldDefinition.count(),
      expected: sum({ values: config.types.map((type) => type.fields?.length ?? 0) }),
    },
    { what: "items", actual: await db.item.count(), expected: config.items.length },
    {
      what: "capacities",
      actual: await db.itemSetup.count(),
      expected: sum({ values: config.items.map((item) => Object.keys(item.setups ?? {}).length) }),
    },
    {
      what: "parts",
      actual: await db.itemComponent.count(),
      expected: sum({ values: config.items.map((item) => item.parts?.length ?? 0) }),
    },
  ];
}

/**
 * Slice 2 checks: row counts per entity match the data files, lists that must not exist do
 * not (check 2: Vingaleden has no "Allergens"), and imported lists have their values.
 */
export async function checkDemoConfig({ context, org }: CheckDemoConfigInput): Promise<string[]> {
  const all = [...(await counts({ context, org })), ...(await customerCounts({ context, org }))];
  const failures = all
    .filter((count) => count.actual !== count.expected)
    .map((count) => `${org.slug}: ${count.actual} ${count.what}, expected ${count.expected}`);
  for (const name of org.config.checks.absentLists ?? []) {
    if (await context.db.vocabulary.count({ where: { name } })) {
      failures.push(`${org.slug}: has a list "${name}"`);
    }
  }
  for (const [name, size] of Object.entries(org.config.checks.listSizes ?? {})) {
    const values = await context.db.vocabularyValue.count({ where: { vocabulary: { name } } });
    if (values !== size) failures.push(`${org.slug}: list "${name}" has ${values} values`);
  }
  return failures;
}
