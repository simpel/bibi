import "server-only";
import { listCustomers, listItems } from "@bibi/core";
import type { NamedOption } from "@/components/form/named-option";
import { runOperation } from "@/server/run-operation";

/** What the price list forms pick from: customers and PRICED items. */
export type PriceListFormData = {
  customers: NamedOption[];
  items: NamedOption[];
  /** The caller may not view customers: they show as hidden and the picker is disabled. */
  customersHidden: boolean;
  /** The caller may not view items: their prices cannot be edited here. */
  itemsHidden: boolean;
};

const LIMIT = 100;

const named = ({ rows }: { rows: { id: string; name: string }[] }): NamedOption[] =>
  rows.map(({ id, name }) => ({ id, name }));

/** The first page of each; empty and flagged hidden when the caller may not read them. */
export async function loadPriceListFormData(): Promise<PriceListFormData> {
  const [customers, items] = await Promise.all([
    runOperation({ operation: listCustomers, input: { limit: LIMIT } }),
    runOperation({ operation: listItems, input: { capability: "PRICED", limit: LIMIT } }),
  ]);
  return {
    customers: customers.ok ? named({ rows: customers.value.items }) : [],
    items: items.ok ? named({ rows: items.value.items }) : [],
    customersHidden: !customers.ok,
    itemsHidden: !items.ok,
  };
}
