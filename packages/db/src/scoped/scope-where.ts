import { GLOBAL_READ_MODELS, READ_OPERATIONS, SOFT_DELETE_DEFAULTS } from "./models";

type Args = Record<string, unknown>;

export type ScopeWhereInput = {
  model: string;
  operation: string;
  where: unknown;
  organizationId: string;
  /** Apply the soft-delete default (reads and updates). */
  softDelete: boolean;
};

type SharedInput = { where: Args; organizationId: string };

/** Org rows OR global rows, ANDed with whatever the caller asked for (fails closed). */
function withGlobalRows({ where, organizationId }: SharedInput): Args {
  const and = where.AND === undefined ? [] : Array.isArray(where.AND) ? where.AND : [where.AND];
  return { ...where, AND: [...and, { OR: [{ organizationId }, { organizationId: null }] }] };
}

/** Pins a `where` to one organization; global-read models also match global rows on reads. */
export function scopeWhere({
  model,
  operation,
  where,
  organizationId,
  softDelete,
}: ScopeWhereInput): Args {
  const input: Args = { ...((where as Args | undefined) ?? {}) };
  const shared = GLOBAL_READ_MODELS.has(model) && READ_OPERATIONS.has(operation);
  const base = shared ? withGlobalRows({ where: input, organizationId }) : { ...input, organizationId };
  const statusDefault = SOFT_DELETE_DEFAULTS.get(model);
  if (softDelete && statusDefault !== undefined && base.status === undefined) {
    base.status = statusDefault;
  }
  return base;
}
