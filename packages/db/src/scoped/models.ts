/** Models that carry `organizationId` and may be accessed through `scopedDb`. */
export const ORG_SCOPED_MODELS = new Set<string>([
  "Venue",
  "EntityType",
  "FieldDefinition",
  "Vocabulary",
  "VocabularyValue",
  "Setup",
  "Item",
  "ItemSetup",
  "ItemComponent",
  "AuditLog",
  "Embedding",
  "Conversation",
  "Message",
  "Skill",
  "OrganizationRole",
  "Member",
]);

/**
 * Soft-deleted models and the `status` filter reads/updates get unless the caller filters
 * `status` itself. Skill uses DRAFT/PUBLISHED/ARCHIVED, the others RecordStatus.
 */
export const SOFT_DELETE_DEFAULTS: ReadonlyMap<string, unknown> = new Map<string, unknown>([
  ["Venue", "ACTIVE"],
  ["EntityType", "ACTIVE"],
  ["FieldDefinition", "ACTIVE"],
  ["Vocabulary", "ACTIVE"],
  ["VocabularyValue", "ACTIVE"],
  ["Setup", "ACTIVE"],
  ["Item", "ACTIVE"],
  ["Conversation", "ACTIVE"],
  ["Skill", { not: "ARCHIVED" }],
  ["OrganizationRole", "ACTIVE"],
]);

/** Models soft-deleted via `status`; reads exclude archived rows unless `status` is filtered. */
export const SOFT_DELETE_MODELS = new Set<string>(SOFT_DELETE_DEFAULTS.keys());

/** Append-only models: no update/delete/upsert through `scopedDb`. */
export const APPEND_ONLY_MODELS = new Set<string>(["AuditLog", "Message"]);

/**
 * Models with global rows (`organizationId` null, e.g. SYSTEM skills). Reads through `scopedDb`
 * see the org's rows plus the global rows; writes stay pinned to the org, so global rows can
 * never be created, updated or deleted through `scopedDb` (only by dedicated system code).
 */
export const GLOBAL_READ_MODELS = new Set<string>(["Skill"]);

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
