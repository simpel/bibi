import "server-only";
import { listCustomers, listItems } from "@okazi/core";
import type { NamedOption } from "@/components/form/named-option";
import { runOperation } from "@/server/run-operation";

/** What the price list forms pick from: customers and PRICED items. */
export type PriceListFormData = { customers: NamedOption[]; items: NamedOption[] };

const LIMIT = 100;

const named = ({ rows }: { rows: { id: string; name: string }[] }): NamedOption[] =>
  rows.map(({ id, name }) => ({ id, name }));

/** The first page of each; empty when the caller may not read them. */
export async function loadPriceListFormData(): Promise<PriceListFormData> {
  const [customers, items] = await Promise.all([
    runOperation({ operation: listCustomers, input: { limit: LIMIT } }),
    runOperation({ operation: listItems, input: { behaviour: "PRICED", limit: LIMIT } }),
  ]);
  return {
    customers: customers.ok ? named({ rows: customers.value.items }) : [],
    items: items.ok ? named({ rows: items.value.items }) : [],
  };
}
