import { DOMAIN_HISTORY_MODELS } from "./append-only-models";

/** Models that carry `organizationId` and may be accessed through `scopedDb`. */
export const ORG_SCOPED_MODELS = new Set<string>([
  "Venue",
  "EntityType",
  "FieldDefinition",
  "Vocabulary",
  "VocabularyValue",
  "Setup",
  "SheetDefinition",
  "SheetDefinitionEntityType",
  "SheetDefinitionField",
  "SheetDefinitionVocabulary",
  "Responsibility",
  "ResponsibilityEntityType",
  "ResponsibilityDefaultFollower",
  "PermissionOverride",
  "Assignment",
  "AssignmentFollower",
  "Record",
  "RecordLink",
  "Item",
  "ItemSetup",
  "ItemPart",
  "ItemCustomisationGroup",
  "ItemCustomisationOption",
  "ItemDemand",
  "ItemDemandTag",
  "MemberProfile",
  "MemberProfileItem",
  "Customer",
  "Contact",
  "PriceList",
  "PriceListItem",
  "Occupancy",
  "HoursDay",
  "HoursException",
  "TicketStatus",
  "TicketStatusTransition",
  "Board",
  "BoardPhase",
  "BoardPhaseStatus",
  "ItemState",
  "ItemStateTransition",
  "StatusStateRule",
  "Ticket",
  "TicketTemplate",
  "TicketTemplateLine",
  "Line",
  "LineAllocation",
  "AlternativeGroup",
  ...DOMAIN_HISTORY_MODELS,
  "Requirement",
  "Sheet",
  "SheetRecipient",
  "Quote",
  "OrderLine",
  "InboundEmail",
  "PaymentAccount",
  "Payment",
  "Deposit",
  "Invoice",
  "AuditLog",
  "Embedding",
  "Conversation",
  "Message",
  "Skill",
  "Member",
  "Invitation",
  "Apikey",
  "OauthGrantRevocation",
  "OrganizationProfile",
]);

/** Global tables (ADR 0006): Better Auth's, shared across organizations, refused by `scopedDb`. */
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
 * User-scoped tables (ADR 0039): one user's rows (`userId`) across organizations. `scopedDb` pins
 * every query to its `actorId` and refuses the system actor. No `organizationId`, `status`, `createdBy`.
 */
export const USER_SCOPED_MODELS = new Set<string>([
  "UserPreference",
  "UserProfile",
  "UserWorkingHours",
  "UserSettings",
]);

/** Every model that is deliberately not org-scoped. Each Prisma model is here or org-scoped. */
export const UNSCOPED_MODELS = new Set<string>([
  ...GLOBAL_MODELS,
  ...PLATFORM_MODELS,
  ...USER_SCOPED_MODELS,
]);
