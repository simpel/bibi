/** Models that carry `organizationId` and may be accessed through `scopedDb`. */
export const ORG_SCOPED_MODELS = new Set<string>(["Venue", "Room", "AuditLog", "Embedding"]);

/** Models soft-deleted via `status`; reads exclude ARCHIVED unless `status` is filtered. */
export const SOFT_DELETE_MODELS = new Set<string>(["Venue", "Room"]);

/** Append-only models: no update/delete through `scopedDb`. */
export const APPEND_ONLY_MODELS = new Set<string>(["AuditLog"]);

export const READ_OPERATIONS = new Set<string>([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

export const CREATE_OPERATIONS = new Set<string>(["create", "createMany", "createManyAndReturn"]);

export const UPDATE_OPERATIONS = new Set<string>(["update", "updateMany", "updateManyAndReturn"]);

export const DELETE_OPERATIONS = new Set<string>(["delete", "deleteMany"]);
