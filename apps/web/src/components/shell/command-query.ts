import type { Permission } from "@bibi/core";
import { ORDER_QUALIFIERS } from "@bibi/core/schemas";
import { ROUTES } from "@/lib/routes";

/** The entity lists the command bar searches with a prefix (`customer:acme`). */
export type CommandScope = "order" | "customer" | "venue" | "item";

/**
 * What the command bar's text asks for: one order by its reference (`#34`, `order:34`), one list
 * searched by name (`customer:acme`), or the order list with its own filters (`status:Lead`).
 */
export type CommandQuery =
  | { kind: "reference"; reference: number }
  | { kind: "scope"; scope: CommandScope; text: string }
  | { kind: "orders"; q: string };

/** Prefix words per list, English and Swedish; the first is the one the bar suggests. */
export const SCOPE_PREFIXES: Record<CommandScope, readonly string[]> = {
  order: ["order", "orders", "bokning", "ordrar"],
  customer: ["customer", "client", "kund"],
  venue: ["venue", "lokal", "anläggning"],
  item: ["item", "artikel"],
};

/** A list's prefix needs its feature's `read` (ADR 0050). */
export const SCOPE_PERMISSION: Record<CommandScope, Permission> = {
  order: "order:read",
  customer: "customer:read",
  venue: "venue:read",
  item: "item:read",
};

const PREFIX = /^([\p{L}]+):(.*)$/u;
const REFERENCE = /^#?(\d{1,9})$/;
const QUALIFIER = /(?:^|\s)-?([a-z]+):\S/gi;

const scopeOf = ({ word }: { word: string }): CommandScope | undefined =>
  (Object.keys(SCOPE_PREFIXES) as CommandScope[]).find((scope) =>
    SCOPE_PREFIXES[scope].includes(word.toLowerCase()),
  );

const hasOrderQualifier = ({ text }: { text: string }) =>
  [...text.matchAll(QUALIFIER)].some(([, key]) =>
    (ORDER_QUALIFIERS as readonly string[]).includes(key?.toLowerCase() ?? ""),
  );

const referenceOf = ({ text }: { text: string }) => {
  const match = REFERENCE.exec(text);
  return match ? Number(match[1]) : undefined;
};

/** Reads the bar's text; null when it is plain text (commands and the assistant handle it). */
export function parseCommandQuery({ query }: { query: string }): CommandQuery | null {
  const text = query.trim();
  const reference = text.startsWith("#") ? referenceOf({ text }) : undefined;
  if (reference !== undefined) return { kind: "reference", reference };
  const [, word = "", rest = ""] = PREFIX.exec(text) ?? [];
  const scope = scopeOf({ word });
  const value = rest.trim().replaceAll('"', "");
  const otherFilters = hasOrderQualifier({ text: rest });
  if (scope && !otherFilters) {
    const orderReference = scope === "order" ? referenceOf({ text: value }) : undefined;
    if (orderReference !== undefined) return { kind: "reference", reference: orderReference };
    return value ? { kind: "scope", scope, text: value } : null;
  }
  if (hasOrderQualifier({ text })) return { kind: "orders", q: text };
  return null;
}

const LIST_ROUTES: Record<CommandScope, string> = {
  order: ROUTES.orders,
  customer: ROUTES.customers,
  venue: ROUTES.venues,
  item: ROUTES.items,
};

/** The list page searched for `q`: where Enter goes when a search finds more than one. */
export function commandListHref({ scope, q }: { scope: CommandScope; q: string }): string {
  return `${LIST_ROUTES[scope]}?${new URLSearchParams({ q }).toString()}`;
}
