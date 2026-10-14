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
  components: Components;
};

/** Parts are active items, each listed once, with no cycle and at most 5 levels (ADR 0021). */
export async function checkComponents({
  context,
  parentId,
  components,
}: CheckComponentsInput): Promise<Result<true>> {
  const ids = components.map((component) => component.itemId);
  if (new Set(ids).size !== ids.length) return problem({ message: "A part is listed twice" });
  if (parentId && ids.includes(parentId)) {
    return problem({ message: "An item cannot contain itself" });
  }
  if ((await context.db.item.count({ where: { id: { in: ids } } })) !== ids.length) {
    return problem({ message: "Unknown part" });
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
    data: components.map(({ itemId: partId, ...component }) => ({
      ...component,
      partId,
      parentId: itemId,
      organizationId: context.organizationId,
      createdBy: context.actor.userId,
    })),
  });
}
