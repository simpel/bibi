import {
  APPEND_ONLY_MODELS,
  CREATE_OPERATIONS,
  DELETE_OPERATIONS,
  ORG_SCOPED_MODELS,
  READ_OPERATIONS,
  SOFT_DELETE_MODELS,
  UPDATE_OPERATIONS,
} from "./models";
import { ScopeViolationError } from "./scope-violation";

type Args = Record<string, unknown>;

export type ApplyScopeInput = {
  model: string;
  operation: string;
  args: unknown;
  organizationId: string;
};

type WhereInput = { model: string; where: unknown; organizationId: string; softDelete: boolean };

function scopeWhere({ model, where, organizationId, softDelete }: WhereInput): Args {
  const base: Args = { ...((where as Args | undefined) ?? {}), organizationId };
  if (softDelete && SOFT_DELETE_MODELS.has(model) && base.status === undefined) {
    base.status = "ACTIVE";
  }
  return base;
}

type DataInput = { data: unknown; organizationId: string };

function scopeCreateData({ data, organizationId }: DataInput): unknown {
  if (Array.isArray(data)) {
    return data.map((row: Args) => ({ ...row, organizationId }));
  }
  return { ...(data as Args), organizationId };
}

type StripInput = { data: unknown };

function stripOrganizationId({ data }: StripInput): Args {
  const { organizationId: _ignored, ...rest } = (data as Args | undefined) ?? {};
  return rest;
}

/** Rewrites Prisma args so every query is pinned to one organization. Fails closed. */
export function applyScope({ model, operation, args, organizationId }: ApplyScopeInput): Args {
  const input: Args = { ...((args as Args | undefined) ?? {}) };
  if (!ORG_SCOPED_MODELS.has(model)) {
    throw new ScopeViolationError({ model, operation, reason: "model is not org-scoped" });
  }
  const mutates = UPDATE_OPERATIONS.has(operation) || DELETE_OPERATIONS.has(operation);
  if (APPEND_ONLY_MODELS.has(model) && (mutates || operation === "upsert")) {
    throw new ScopeViolationError({ model, operation, reason: "model is append-only" });
  }
  if (CREATE_OPERATIONS.has(operation)) {
    return { ...input, data: scopeCreateData({ data: input.data, organizationId }) };
  }
  const softDelete = READ_OPERATIONS.has(operation) || UPDATE_OPERATIONS.has(operation);
  const where = scopeWhere({ model, where: input.where, organizationId, softDelete });
  if (operation === "upsert") {
    const create = scopeCreateData({ data: input.create, organizationId });
    return { ...input, where, create, update: stripOrganizationId({ data: input.update }) };
  }
  if (UPDATE_OPERATIONS.has(operation)) {
    return { ...input, where, data: stripOrganizationId({ data: input.data }) };
  }
  if (READ_OPERATIONS.has(operation) || DELETE_OPERATIONS.has(operation)) {
    return { ...input, where };
  }
  throw new ScopeViolationError({ model, operation, reason: "operation not supported" });
}
