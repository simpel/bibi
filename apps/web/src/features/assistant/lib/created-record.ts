import type { ChangePreview } from "@bibi/core/schemas";
import { entityTypeRoute, itemRoute } from "@/lib/configuration-routes";
import { customerRoute, orderRoute, quoteRoute, skillRoute, venueRoute } from "@/lib/routes";

type IdRoute = (input: { id: string }) => string;

/** The page where a new record's setup continues, per type; other types get no button. */
const ROUTES: Readonly<Record<string, IdRoute>> = {
  venue: venueRoute,
  customer: customerRoute,
  order: orderRoute,
  quote: quoteRoute,
  skill: skillRoute,
  item: itemRoute,
  entityType: entityTypeRoute,
};

/** What a confirmed proposal made: the record's name and, for a create, where to continue. */
export type CreatedRecord = { name: string | null; href: string | null; created: boolean };

export type CreatedRecordInput = { preview: ChangePreview | undefined; result: unknown };

const field = ({ result, key }: { result: unknown; key: string }): string | null => {
  if (typeof result !== "object" || result === null) return null;
  const value = (result as Record<string, unknown>)[key];
  return typeof value === "string" && value !== "" ? value : null;
};

/**
 * The record a confirmed proposal created, read from the operation's result (the preview's id is
 * from a rolled-back run, so only the result has the real id).
 */
export function createdRecord({ preview, result }: CreatedRecordInput): CreatedRecord {
  const change = preview?.changes.length === 1 ? preview.changes[0] : undefined;
  const name = field({ result, key: "name" }) ?? change?.name ?? null;
  if (change?.kind !== "create") return { name, href: null, created: false };
  const id = field({ result, key: "id" });
  const route = ROUTES[change.entityType];
  return { name, href: id && route ? route({ id }) : null, created: true };
}
