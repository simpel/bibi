/** Actions on a resource, from least to most privileged (ADR 0003). */
export const PERMISSION_ACTIONS = ["read", "write", "admin"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

/**
 * Every resource an operation can require a permission on. New resource → add it here and to
 * the fixed role map in `packages/auth` (ADR 0034).
 */
export const RESOURCES = [
  "venue",
  "item",
  "customer",
  "contact",
  "priceList",
  "occupancy",
  "configuration",
  "bookingStatus",
  "booking",
  "programItem",
  "assignment",
  "requirement",
  "sheet",
  "inquiry",
  "option",
  "quote",
  "search",
  "conversation",
  "skill",
  "member",
  "audit",
  "payment",
  "integration",
] as const;
export type Resource = (typeof RESOURCES)[number];

/** The fixed role with every permission (ADR 0034). Never on an invitation or an API key. */
export const OWNER_ROLE = "owner";
