import { CREATED_BY_MODELS } from "./conventions";
import {
  APPEND_ONLY_MODELS,
  CREATE_OPERATIONS,
  DELETE_OPERATIONS,
  ORG_SCOPED_MODELS,
  READ_OPERATIONS,
  UPDATE_OPERATIONS,
} from "./models";
import { assertNoNestedWrites } from "./nested-writes";
import { ScopeViolationError } from "./scope-violation";
import { scopeWhere } from "./scope-where";

type Args = Record<string, unknown>;

export type ApplyScopeInput = {
  model: string;
  operation: string;
  args: unknown;
  organizationId: string;
  /** Written to `createdBy` on create for models that have the column (ADR 0006). */
  actorId: string;
};

type DataInput = { model: string; data: unknown; organizationId: string; actorId: string };

/** Forces `organizationId`, and `createdBy` where the model has it, on every created row. */
function scopeCreateData({ model, data, organizationId, actorId }: DataInput): unknown {
  const forced: Args = CREATED_BY_MODELS.has(model)
    ? { organizationId, createdBy: actorId }
    : { organizationId };
  if (Array.isArray(data)) {
    return data.map((row: Args) => ({ ...row, ...forced }));
  }
  return { ...(data as Args), ...forced };
}

type StripInput = { data: unknown };

/** Ownership columns are immutable: updates may not move a row or rewrite its author. */
function stripOwnership({ data }: StripInput): Args {
  const { organizationId: _org, createdBy: _author, ...rest } = (data as Args | undefined) ?? {};
  return rest;
}

/** Rewrites Prisma args so every query is pinned to one organization. Fails closed. */
export function applyScope({
  model,
  operation,
  args,
  organizationId,
  actorId,
}: ApplyScopeInput): Args {
  const input: Args = { ...((args as Args | undefined) ?? {}) };
  if (!ORG_SCOPED_MODELS.has(model)) {
    throw new ScopeViolationError({ model, operation, reason: "model is not org-scoped" });
  }
  const mutates = UPDATE_OPERATIONS.has(operation) || DELETE_OPERATIONS.has(operation);
  if (APPEND_ONLY_MODELS.has(model) && (mutates || operation === "upsert")) {
    throw new ScopeViolationError({ model, operation, reason: "model is append-only" });
  }
  for (const data of [input.data, input.create, input.update]) {
    assertNoNestedWrites({ model, operation, data });
  }
  if (CREATE_OPERATIONS.has(operation)) {
    const data = scopeCreateData({ model, data: input.data, organizationId, actorId });
    return { ...input, data };
  }
  const softDelete = READ_OPERATIONS.has(operation) || UPDATE_OPERATIONS.has(operation);
  const where = scopeWhere({ model, operation, where: input.where, organizationId, softDelete });
  if (operation === "upsert") {
    const create = scopeCreateData({ model, data: input.create, organizationId, actorId });
    return { ...input, where, create, update: stripOwnership({ data: input.update }) };
  }
  if (UPDATE_OPERATIONS.has(operation)) {
    return { ...input, where, data: stripOwnership({ data: input.data }) };
  }
  if (READ_OPERATIONS.has(operation) || DELETE_OPERATIONS.has(operation)) {
    return { ...input, where };
  }
  throw new ScopeViolationError({ model, operation, reason: "operation not supported" });
}
