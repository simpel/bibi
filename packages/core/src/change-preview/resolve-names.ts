import { hasPermission } from "../operations/permission";
import type { OperationContext } from "../operations/types";
import { ENTITY_FEATURE } from "../permissions/entity-features";
import type { PermissionSet } from "../permissions/permission-set";

type Db = Pick<OperationContext, "db">["db"];
type Named = { id: string; name: string };
type FindNamed = (input: { db: Db; ids: string[] }) => Promise<Named[]>;

const select = { id: true, name: true } as const;

/**
 * The organization's named records whose ids can appear in a change (all org-scoped), by entity
 * type: a name is only resolved when the caller may view the type's feature (ENTITY_FEATURE).
 */
const FINDERS: Readonly<Record<string, FindNamed>> = {
  item: ({ db, ids }) => db.item.findMany({ where: { id: { in: ids } }, select }),
  setup: ({ db, ids }) => db.setup.findMany({ where: { id: { in: ids } }, select }),
  entityType: ({ db, ids }) => db.entityType.findMany({ where: { id: { in: ids } }, select }),
  venue: ({ db, ids }) => db.venue.findMany({ where: { id: { in: ids } }, select }),
  ticketStatus: ({ db, ids }) => db.ticketStatus.findMany({ where: { id: { in: ids } }, select }),
  itemState: ({ db, ids }) => db.itemState.findMany({ where: { id: { in: ids } }, select }),
  priceList: ({ db, ids }) => db.priceList.findMany({ where: { id: { in: ids } }, select }),
  responsibility: ({ db, ids }) =>
    db.responsibility.findMany({ where: { id: { in: ids } }, select }),
  vocabularyValue: ({ db, ids }) =>
    db.vocabularyValue.findMany({ where: { id: { in: ids } }, select }),
  fieldDefinition: ({ db, ids }) =>
    db.fieldDefinition.findMany({ where: { id: { in: ids } }, select }),
  customer: ({ db, ids }) => db.customer.findMany({ where: { id: { in: ids } }, select }),
};

type VisibleInput = { entityType: string; permissions: PermissionSet };

/** Unknown types fail closed; `self` types are never resolved here. */
function nameVisible({ entityType, permissions }: VisibleInput): boolean {
  const feature = ENTITY_FEATURE[entityType];
  if (!feature || feature === "self") return false;
  return hasPermission({ permissions, permission: `${feature}:read` });
}

/** Strings that look like record ids (cuid2), wherever they appear in paths or values. */
export function idsIn({ texts }: { texts: readonly unknown[] }): string[] {
  const found = new Set<string>();
  for (const text of texts) {
    for (const match of JSON.stringify(text ?? null).matchAll(/\b[a-z][a-z0-9]{19,31}\b/g)) {
      found.add(match[0]);
    }
  }
  return [...found];
}

export type ResolveNamesInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  ids: readonly string[];
};

/**
 * Names by id for the ids the organization has a named record for and the caller may view
 * (ADR 0050, feature scope); others are left out, so the preview shows them as ids.
 */
export async function resolveNames({
  context,
  ids,
}: ResolveNamesInput): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { db, permissions } = context;
  const finders = Object.entries(FINDERS)
    .filter(([entityType]) => nameVisible({ entityType, permissions }))
    .map(([, find]) => find);
  const rows = await Promise.all(finders.map((find) => find({ db, ids: [...ids] })));
  return Object.fromEntries(rows.flat().map((row) => [row.id, row.name]));
}
