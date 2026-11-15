"use server";

import { listCustomers, listItems, listOrders, listVenues } from "@bibi/core";
import type { CommandScope } from "@/components/shell/command-query";
import type { ActionResult } from "@/lib/action-result";
import { itemRoute } from "@/lib/configuration-routes";
import { customerRoute, orderRoute, venueRoute } from "@/lib/routes";
import { runOperation } from "@/server/run-operation";
import { type CommandHit, type CommandLookup, matchByName } from "./command-hits";

/** One order by reference, or one list searched by name. */
export type CommandLookupInput =
  | { kind: "reference"; reference: number }
  | { kind: "scope"; scope: CommandScope; text: string };

/** Shown at most; `more` says the list has further matches. */
const SHOWN = 6;

const none: CommandLookup = { hits: [], more: false };

type OrderRow = { id: string; reference: number; title: string | null };

const orderHit = ({ order }: { order: OrderRow }): CommandHit => ({
  id: order.id,
  title: order.title ?? `#${order.reference}`,
  detail: `#${order.reference}`,
  href: orderRoute({ id: order.id }),
});

async function lookupOrders({ q, reference }: { q: string; reference?: number }) {
  const result = await runOperation({ operation: listOrders, input: { q, limit: SHOWN } });
  if (!result.ok) return none;
  const rows: OrderRow[] = result.value.items;
  const found = reference === undefined ? rows : rows.filter((o) => o.reference === reference);
  const more = reference === undefined && result.value.nextCursor !== null;
  return { hits: found.map((order) => orderHit({ order })), more };
}

async function lookupCustomers({ text }: { text: string }): Promise<CommandLookup> {
  const input = { query: text, limit: SHOWN };
  const result = await runOperation({ operation: listCustomers, input });
  if (!result.ok) return none;
  const hits = result.value.items.map(({ id, name }: { id: string; name: string }) => ({
    id,
    title: name,
    detail: null,
    href: customerRoute({ id }),
  }));
  return { hits, more: result.value.nextCursor !== null };
}

/** Venues and items are searched like their list pages do: by name, in the first 100. */
async function lookupNamed({ scope, text }: { scope: "venue" | "item"; text: string }) {
  const input = { limit: 100 };
  const result =
    scope === "venue"
      ? await runOperation({ operation: listVenues, input })
      : await runOperation({ operation: listItems, input });
  if (!result.ok) return none;
  const route = scope === "venue" ? venueRoute : itemRoute;
  const rows: { id: string; name: string }[] = result.value.items;
  return matchByName({ rows, text, shown: SHOWN, href: route });
}

/** The command bar's answer for a prefix search (`#34`, `customer:acme`); none when forbidden. */
export async function commandLookupAction({
  query,
}: {
  query: CommandLookupInput;
}): Promise<ActionResult<CommandLookup>> {
  const value = await lookup({ input: query });
  return { ok: true, value };
}

function lookup({ input }: { input: CommandLookupInput }): Promise<CommandLookup> {
  if (input.kind === "reference") {
    return lookupOrders({ q: `#${input.reference}`, reference: input.reference });
  }
  const { scope, text } = input;
  if (scope === "order") return lookupOrders({ q: text });
  if (scope === "customer") return lookupCustomers({ text });
  return lookupNamed({ scope, text });
}
