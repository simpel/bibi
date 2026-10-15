/** Actions on a resource, from least to most privileged (ADR 0003). */
export const PERMISSION_ACTIONS = ["read", "write", "admin"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

/**
 * Every resource an operation can require a permission on. New resource → add it here; roles
 * (ADR 0020) can only grant resources listed here.
 */
export const RESOURCES = [
  "venue",
  "item",
  "customer",
  "contact",
  "occupancy",
  "configuration",
  "bookingStatus",
  "booking",
  "programItem",
  "search",
  "conversation",
  "skill",
  "role",
  "member",
  "audit",
  "payment",
] as const;
export type Resource = (typeof RESOURCES)[number];

/** The fixed system role with every permission (ADR 0020). Never stored as an org role. */
export const OWNER_ROLE = "owner";
