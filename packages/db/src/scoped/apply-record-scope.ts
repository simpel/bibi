import { CREATE_OPERATIONS } from "./operation-kinds";
import { ENGINE_PURPOSES, RECORD_INTENT_KEY, type RecordIntent } from "./record-intent";
import { and, predicateFor, type WalkContext, walkSelection, walkWhere } from "./record-scope-walk";
import { RECORD_SCOPED_MODELS } from "./record-scoped-models";
import { RELATIONS } from "./relation-map.generated";
import type { RelationMap } from "./relation-types";
import { ScopeViolationError } from "./scope-violation";

type Args = Record<string, unknown>;

export type ApplyRecordScopeInput = {
  model: string;
  operation: string;
  args: Args;
  /** Overridable for tests; production uses the map and the generated relations. */
  scoped?: ReadonlyMap<string, string>;
  relations?: RelationMap;
};

/** The declared intent, or undefined for the plain client; a malformed one is refused. */
function readIntent({ model, operation, raw }: { model: string; operation: string; raw: unknown }) {
  if (raw === undefined) return undefined;
  const intent = raw as RecordIntent;
  const valid =
    (intent?.kind === "engine" && ENGINE_PURPOSES.includes(intent.purpose)) ||
    (intent?.kind === "records" &&
      typeof intent.predicates === "object" &&
      intent.predicates !== null);
  if (!valid)
    throw new ScopeViolationError({ model, operation, reason: "malformed record intent" });
  return intent;
}

/**
 * Record access (ADR 0113): strips the declared intent and applies it. An engine read passes
 * unchanged. A records read gets the caller's filter on a record-scoped model and on every hop
 * into another root (or is refused where it cannot be filtered). The plain client is refused
 * whenever a record-scoped model of another root is touched.
 */
export function applyRecordScope({
  model,
  operation,
  args,
  scoped = RECORD_SCOPED_MODELS,
  relations = RELATIONS,
}: ApplyRecordScopeInput): Args {
  const { [RECORD_INTENT_KEY]: raw, ...rest } = args;
  const intent = readIntent({ model, operation, raw });
  if (intent?.kind === "engine") return rest;
  const ctx: WalkContext = { model, operation, intent, scoped, relations };
  const out: Args = { ...rest };
  let rootPred: unknown;
  if (scoped.has(model)) {
    if (operation === "upsert") {
      const reason = "upsert on a record-scoped model: use context.engine";
      throw new ScopeViolationError({ model, operation, reason });
    }
    const pred = predicateFor({ ctx, target: model });
    if (!CREATE_OPERATIONS.has(operation)) rootPred = pred;
  }
  if (out.where !== undefined || rootPred !== undefined) {
    out.where = and({ a: walkWhere({ ctx, model, where: out.where }), b: rootPred });
  }
  if (out.include !== undefined) {
    out.include = walkSelection({ ctx, model, selection: out.include });
  }
  if (out.select !== undefined) out.select = walkSelection({ ctx, model, selection: out.select });
  return out;
}
