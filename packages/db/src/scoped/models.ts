/** Models that carry `organizationId` and may be accessed through `scopedDb`. */
export const ORG_SCOPED_MODELS = new Set<string>([
  "Venue",
  "EntityType",
  "FieldDefinition",
  "Vocabulary",
  "VocabularyValue",
  "Setup",
  "SheetDefinition",
  "Responsibility",
  "Assignment",
  "AssignmentFollower",
  "Item",
  "ItemSetup",
  "ItemComponent",
  "ItemChoiceGroup",
  "Customer",
  "Contact",
  "PriceList",
  "PriceListItem",
  "Occupancy",
  "TicketPhase",
  "TicketPhaseTransition",
  "ItemState",
  "ItemStateTransition",
  "Ticket",
  "ProgramItem",
  "Requirement",
  "Sheet",
  "Quote",
  "OrderLine",
  "InboundEmail",
  "PaymentAccount",
  "Payment",
  "AuditLog",
  "Embedding",
  "Conversation",
  "Message",
  "Skill",
  "Member",
  "Invitation",
  "Apikey",
  "OauthGrantRevocation",
]);

/**
 * Global tables (ADR 0006): Better Auth's identity, session, API key and OAuth tables. They are
 * shared across organizations, owned by Better Auth (`auth.prisma`) and refused by `scopedDb`.
 */
export const GLOBAL_MODELS = new Set<string>([
  "User",
  "Session",
  "Account",
  "Verification",
  "Organization",
  "Jwks",
  "OauthClient",
  "OauthResource",
  "OauthClientResource",
  "OauthRefreshToken",
  "OauthAccessToken",
  "OauthConsent",
  "OauthClientAssertion",
]);

/** Platform tables (ADR 0015): written only by platform code with `getDb()`, refused by `scopedDb`. */
export const PLATFORM_MODELS = new Set<string>(["SystemLog", "AiSetting", "StripeWebhookEvent"]);

/**
 * User-scoped tables (ADR 0039): rows belong to one user (`userId`) across organizations, e.g.
 * UI preferences. `scopedDb` pins every query to its `actorId` instead of the organization and
 * refuses them for the system actor. No `organizationId`, `status` or `createdBy`.
 */
export const USER_SCOPED_MODELS = new Set<string>(["UserPreference"]);

/** Every model that is deliberately not org-scoped. Each Prisma model is here or org-scoped. */
export const UNSCOPED_MODELS = new Set<string>([
  ...GLOBAL_MODELS,
  ...PLATFORM_MODELS,
  ...USER_SCOPED_MODELS,
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
  ["SheetDefinition", "ACTIVE"],
  ["Responsibility", "ACTIVE"],
  ["Assignment", "ACTIVE"],
  ["Item", "ACTIVE"],
  ["Customer", "ACTIVE"],
  ["Contact", "ACTIVE"],
  ["PriceList", "ACTIVE"],
  ["Occupancy", "ACTIVE"],
  ["TicketPhase", "ACTIVE"],
  ["ItemState", "ACTIVE"],
  ["Ticket", "ACTIVE"],
  ["ProgramItem", "ACTIVE"],
  ["Requirement", "ACTIVE"],
  ["Quote", "ACTIVE"],
  ["Conversation", "ACTIVE"],
  ["Skill", { not: "ARCHIVED" }],
]);

/** Models soft-deleted via `status`; reads exclude archived rows unless `status` is filtered. */
export const SOFT_DELETE_MODELS = new Set<string>(SOFT_DELETE_DEFAULTS.keys());

/** Append-only models: no update/delete/upsert through `scopedDb`. */
export const APPEND_ONLY_MODELS = new Set<string>(["AuditLog", "Message", "InboundEmail"]);

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
