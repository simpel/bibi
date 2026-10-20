import { MAX_PART_DEPTH } from "./schema";

/** Adjacency: item id → the ids one step away (parts when walking down, parents when up). */
export type Edges = ReadonlyMap<string, readonly string[]>;

type LevelsInput = { edges: Edges; id: string; seen?: ReadonlySet<string> };

/** Longest chain of items starting at `id` and following `edges`, `id` included. */
export function levels({ edges, id, seen = new Set() }: LevelsInput): number {
  if (seen.has(id)) return Number.POSITIVE_INFINITY;
  const next = new Set(seen).add(id);
  const below = (edges.get(id) ?? []).map((to) => levels({ edges, id: to, seen: next }));
  return 1 + Math.max(0, ...below);
}

export type CheckGraphInput = {
  /** The composed item, or undefined when it is being created (no parents, no cycle). */
  parentId: string | undefined;
  partIds: readonly string[];
  down: Edges;
  up: Edges;
};

export type GraphProblem = "cycle" | "depth" | null;

/**
 * Whether giving `parentId` the parts `partIds` closes a cycle or makes a chain longer than
 * MAX_PART_DEPTH levels, counting the parent's own parents above it.
 */
export function checkGraph({ parentId, partIds, down, up }: CheckGraphInput): GraphProblem {
  if (parentId) {
    const seen = new Set<string>();
    const stack = [...partIds];
    while (stack.length) {
      const id = stack.pop() as string;
      if (id === parentId) return "cycle";
      if (seen.has(id)) continue;
      seen.add(id);
      stack.push(...(down.get(id) ?? []));
    }
  }
  const above = parentId ? levels({ edges: up, id: parentId }) - 1 : 0;
  const below = Math.max(0, ...partIds.map((id) => levels({ edges: down, id })));
  return above + 1 + below > MAX_PART_DEPTH ? "depth" : null;
}
