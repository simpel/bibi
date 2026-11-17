import type { RecordIntent } from "./record-intent";
import type { RelationMap } from "./relation-types";
import { ScopeViolationError } from "./scope-violation";

type Args = Record<string, unknown>;

export type WalkContext = {
  /** The model and operation queried, for error messages. */
  model: string;
  operation: string;
  intent: Extract<RecordIntent, { kind: "records" }> | undefined;
  scoped: ReadonlyMap<string, string>;
  relations: RelationMap;
};

type Ctx = { ctx: WalkContext };

const objectOf = ({ value }: { value: unknown }): Args | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Args)
    : undefined;

export const and = ({ a, b }: { a: unknown; b: unknown }): unknown =>
  a === undefined ? b : b === undefined ? a : { AND: [a, b] };

const refuse = ({ ctx, reason }: Ctx & { reason: string }): never => {
  throw new ScopeViolationError({ model: ctx.model, operation: ctx.operation, reason });
};

type Hop = Ctx & { from: string; to: string };

/** A hop into another root's record-scoped model needs the caller's scope. */
const crosses = ({ ctx, from, to }: Hop) =>
  ctx.scoped.has(to) && ctx.scoped.get(from) !== ctx.scoped.get(to);

/** The caller's filter for `target` (undefined: they see every record); plain clients are refused. */
export function predicateFor({ ctx, target }: Ctx & { target: string }): unknown {
  if (!ctx.intent) {
    return refuse({
      ctx,
      reason: `${target} is record-scoped: use context.records or context.engine`,
    });
  }
  if (!(target in ctx.intent.predicates)) {
    return refuse({ ctx, reason: `no record scope given for ${target}` });
  }
  return ctx.intent.predicates[target] ?? undefined;
}

const hopPredicate = ({ ctx, from, to }: Hop) =>
  crosses({ ctx, from, to }) ? predicateFor({ ctx, target: to }) : undefined;

function listFilter({ ctx, from, to, value }: Hop & { value: unknown }): unknown {
  const filter = objectOf({ value });
  if (!filter) return value;
  const pred = hopPredicate({ ctx, from, to });
  const out: Args = {};
  for (const [op, inner] of Object.entries(filter)) {
    const walked = walkWhere({ ctx, model: to, where: inner });
    if (pred === undefined) out[op] = walked;
    // `every` holds over the records the caller sees; hidden ones neither pass nor fail it.
    else if (op === "every") out[op] = { OR: [{ NOT: pred }, walked ?? {}] };
    else out[op] = and({ a: walked, b: pred });
  }
  return out;
}

function oneFilter({ ctx, from, to, value }: Hop & { value: unknown }): unknown {
  const filter = objectOf({ value });
  if (!filter) return value;
  const pred = hopPredicate({ ctx, from, to });
  if (pred !== undefined && "isNot" in filter) {
    refuse({ ctx, reason: `isNot into record-scoped ${to} cannot be limited` });
  }
  if (!("is" in filter) && !("isNot" in filter)) {
    return and({ a: walkWhere({ ctx, model: to, where: filter }), b: pred });
  }
  const out: Args = { ...filter };
  if ("is" in filter) {
    const is = walkWhere({ ctx, model: to, where: filter.is });
    out.is = filter.is === null ? null : and({ a: is, b: pred });
  }
  if ("isNot" in filter) out.isNot = walkWhere({ ctx, model: to, where: filter.isNot });
  return out;
}

export type WalkWhereInput = Ctx & { model: string; where: unknown };

/** `where` with every relation filter into another root limited to the caller (or refused). */
export function walkWhere({ ctx, model, where }: WalkWhereInput): unknown {
  const filter = objectOf({ value: where });
  if (!filter) return where;
  const out: Args = {};
  for (const [key, value] of Object.entries(filter)) {
    if (key === "AND" || key === "OR" || key === "NOT") {
      out[key] = Array.isArray(value)
        ? value.map((item) => walkWhere({ ctx, model, where: item }))
        : walkWhere({ ctx, model, where: value });
      continue;
    }
    const relation = ctx.relations[model]?.[key];
    const hop = { ctx, from: model, to: relation?.target ?? "", value };
    if (!relation) out[key] = value;
    else out[key] = relation.list ? listFilter(hop) : oneFilter(hop);
  }
  return out;
}

function walkCount({ ctx, model, value }: Ctx & { model: string; value: unknown }): unknown {
  if (value === true) {
    const fields = Object.values(ctx.relations[model] ?? {});
    const hidden = fields.find((rel) => rel.list && crosses({ ctx, from: model, to: rel.target }));
    if (hidden) refuse({ ctx, reason: `_count: true would count hidden ${hidden.target}` });
    return value;
  }
  const count = objectOf({ value });
  const selected = objectOf({ value: count?.select });
  if (!count || !selected) return value;
  const select: Args = {};
  for (const [key, entry] of Object.entries(selected)) {
    const relation = ctx.relations[model]?.[key];
    if (!relation || entry === false) {
      select[key] = entry;
      continue;
    }
    const nested = objectOf({ value: entry }) ?? {};
    const pred = hopPredicate({ ctx, from: model, to: relation.target });
    const where = and({
      a: walkWhere({ ctx, model: relation.target, where: nested.where }),
      b: pred,
    });
    select[key] = where === undefined ? entry : { ...nested, where };
  }
  return { ...count, select };
}

export type WalkSelectionInput = Ctx & { model: string; selection: unknown };

/** `include` or `select` with every hop into another root limited (lists) or refused (single). */
export function walkSelection({ ctx, model, selection }: WalkSelectionInput): unknown {
  const fields = objectOf({ value: selection });
  if (!fields) return selection;
  const out: Args = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key === "_count") {
      out[key] = walkCount({ ctx, model, value });
      continue;
    }
    const relation = ctx.relations[model]?.[key];
    if (!relation || value === false) {
      out[key] = value;
      continue;
    }
    const to = relation.target;
    const pred = hopPredicate({ ctx, from: model, to });
    if (!relation.list && crosses({ ctx, from: model, to })) {
      refuse({ ctx, reason: `${key} is a single record-scoped ${to}: read it directly` });
    }
    const nested: Args = { ...(objectOf({ value }) ?? {}) };
    const where = and({ a: walkWhere({ ctx, model: to, where: nested.where }), b: pred });
    if (where !== undefined) nested.where = where;
    if (nested.include)
      nested.include = walkSelection({ ctx, model: to, selection: nested.include });
    if (nested.select) nested.select = walkSelection({ ctx, model: to, selection: nested.select });
    out[key] = value === true && Object.keys(nested).length === 0 ? true : nested;
  }
  return out;
}
