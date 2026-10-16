import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { checkGraph, type Edges } from "./component-graph";
import { MAX_COMPONENT_DEPTH } from "./schema";

type Db = Pick<OperationContext, "db">;
type Components = readonly {
  itemId: string;
  quantity: number;
  offsetMinutes: number;
  durationMinutes: number | null;
  required: boolean;
}[];

const problem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "components", message }] });

type WalkInput = { context: Db; from: readonly string[]; direction: "down" | "up" };

/** Component edges reachable from `from`, one query per level. */
async function walk({ context, from, direction }: WalkInput): Promise<Edges> {
  const edges = new Map<string, string[]>();
  const visited = new Set(from);
  let frontier = [...visited];
  for (let level = 0; frontier.length && level <= MAX_COMPONENT_DEPTH + 1; level++) {
    const key = direction === "down" ? "parentId" : "partId";
    const rows = await context.db.itemComponent.findMany({
      where: { [key]: { in: frontier } },
      select: { parentId: true, partId: true },
    });
    for (const row of rows) {
      const [source, target] =
        direction === "down" ? [row.parentId, row.partId] : [row.partId, row.parentId];
      edges.set(source, [...(edges.get(source) ?? []), target]);
    }
    const next = rows.map((row) => (direction === "down" ? row.partId : row.parentId));
    frontier = [...new Set(next)].filter((id) => !visited.has(id));
    for (const id of frontier) visited.add(id);
  }
  return edges;
}

export type CheckComponentsInput = {
  context: Db;
  parentId: string | undefined;
  /** The customer owning the parent; null = a catalog item, whose parts are catalog items. */
  customerId: string | null;
  components: Components;
};

/**
 * Parts are active items, each listed once, with no cycle and at most 5 levels (ADR 0021). A
 * part is a catalog item or a package of the parent's own customer, never another customer's.
 */
export async function checkComponents({
  context,
  parentId,
  customerId,
  components,
}: CheckComponentsInput): Promise<Result<true>> {
  const ids = components.map((component) => component.itemId);
  if (new Set(ids).size !== ids.length) return problem({ message: "A part is listed twice" });
  if (parentId && ids.includes(parentId)) {
    return problem({ message: "An item cannot contain itself" });
  }
  const owners = [{ customerId: null }, ...(customerId ? [{ customerId }] : [])];
  if ((await context.db.item.count({ where: { id: { in: ids }, OR: owners } })) !== ids.length) {
    return problem({ message: "Unknown part, or a part that belongs to another customer" });
  }
  const down = await walk({ context, from: ids, direction: "down" });
  const up = parentId ? await walk({ context, from: [parentId], direction: "up" }) : new Map();
  const found = checkGraph({ parentId, partIds: ids, down, up });
  if (found === "cycle") return problem({ message: "The parts would form a cycle" });
  if (found === "depth") {
    return problem({ message: `Compositions are at most ${MAX_COMPONENT_DEPTH} levels deep` });
  }
  return ok({ value: true });
}

export type ReplaceComponentsInput = {
  context: OperationContext;
  itemId: string;
  components: Components;
};

/** Replaces the item's parts. Join rows have no history of their own; audit has the item. */
export async function replaceComponents({ context, itemId, components }: ReplaceComponentsInput) {
  await context.db.itemComponent.deleteMany({ where: { parentId: itemId } });
  await context.db.itemComponent.createMany({
    data: components.map(({ itemId: partId, ...component }, position) => ({
      ...component,
      partId,
      position,
      parentId: itemId,
      organizationId: context.organizationId,
    })),
  });
}
