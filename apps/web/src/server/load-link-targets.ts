import "server-only";
import {
  type EntityTypeDto,
  listBookings,
  listContacts,
  listCustomers,
  listEntityTypes,
  listItems,
  type Result,
} from "@okazi/core";
import type { LinkTarget, LinkTargets } from "@/components/typed-fields/typed-form-data";
import { runOperation } from "./run-operation";

const LIMIT = 100;

type TargetsInput = { base: EntityTypeDto["base"]; entityTypeId: string };

type NamedInput = { result: Result<{ items: { id: string; name: string }[] }> };

const named = ({ result }: NamedInput): LinkTarget[] =>
  result.ok ? result.value.items.map(({ id, name }) => ({ value: id, label: name })) : [];

/** The first page of active records of the type, as combobox options. Empty when unreadable. */
async function targetsOf({ base, entityTypeId }: TargetsInput): Promise<LinkTarget[]> {
  const input = { entityTypeId, limit: LIMIT };
  if (base === "ITEM")
    return named({ result: await runOperation({ operation: listItems, input }) });
  if (base === "CUSTOMER")
    return named({ result: await runOperation({ operation: listCustomers, input }) });
  if (base === "CONTACT")
    return named({ result: await runOperation({ operation: listContacts, input }) });
  if (base !== "BOOKING") return [];
  const result = await runOperation({ operation: listBookings, input });
  const rows = result.ok ? result.value.items : [];
  return rows.map(({ id, reference }) => ({ value: id, label: `#${reference}` }));
}

export type LoadLinkTargetsInput = { types: readonly EntityTypeDto[] };

/** Records every LINK field of the types can point to, keyed by target type id. */
export async function loadLinkTargets({ types }: LoadLinkTargetsInput): Promise<LinkTargets> {
  const ids = new Set(
    types.flatMap(({ fields }) =>
      fields.flatMap(({ linkTypeId }) => (linkTypeId ? [linkTypeId] : [])),
    ),
  );
  if (ids.size === 0) return {};
  const all = await runOperation({ operation: listEntityTypes, input: { limit: LIMIT } });
  const targets = (all.ok ? all.value.items : []).filter(({ id }) => ids.has(id));
  const entries = await Promise.all(
    targets.map(async ({ id, base }) => [id, await targetsOf({ base, entityTypeId: id })] as const),
  );
  return Object.fromEntries(entries);
}
