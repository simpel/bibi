/** Soft-deleted models and their default `status` filter (Skill: DRAFT/PUBLISHED/ARCHIVED). */
export const SOFT_DELETE_DEFAULTS: ReadonlyMap<string, unknown> = new Map<string, unknown>([
  ["Venue", "ACTIVE"],
  ["EntityType", "ACTIVE"],
  ["FieldDefinition", "ACTIVE"],
  ["Vocabulary", "ACTIVE"],
  ["VocabularyValue", "ACTIVE"],
  ["Setup", "ACTIVE"],
  ["SheetDefinition", "ACTIVE"],
  ["Responsibility", "ACTIVE"],
  ["PermissionOverride", "ACTIVE"],
  ["Assignment", "ACTIVE"],
  ["Record", "ACTIVE"],
  ["Item", "ACTIVE"],
  ["ItemDemand", "ACTIVE"],
  ["MemberProfile", "ACTIVE"],
  ["Customer", "ACTIVE"],
  ["Contact", "ACTIVE"],
  ["PriceList", "ACTIVE"],
  ["Occupancy", "ACTIVE"],
  ["TicketStatus", "ACTIVE"],
  ["Board", "ACTIVE"],
  ["BoardPhase", "ACTIVE"],
  ["ItemState", "ACTIVE"],
  ["Ticket", "ACTIVE"],
  ["TicketTemplate", "ACTIVE"],
  ["Line", "ACTIVE"],
  ["LineAllocation", "ACTIVE"],
  ["AlternativeGroup", "ACTIVE"],
  ["Requirement", "ACTIVE"],
  ["Quote", "ACTIVE"],
  ["Conversation", "ACTIVE"],
  ["OrganizationProfile", "ACTIVE"],
  ["Skill", { not: "ARCHIVED" }],
]);

/** Models soft-deleted via `status`; reads exclude archived rows unless `status` is filtered. */
export const SOFT_DELETE_MODELS = new Set<string>(SOFT_DELETE_DEFAULTS.keys());

/** Models with global rows (`organizationId` null): reads include them, writes stay org-pinned. */
export const GLOBAL_READ_MODELS = new Set<string>(["Skill"]);
