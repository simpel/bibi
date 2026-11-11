import type { Permission } from "@bibi/core";

/** Every section of the administration pages; texts in `adminArea.search.entries.<id>`. */
export type AdminSectionId =
  | "timeZone"
  | "domainJoin"
  | "members"
  | "invitations"
  | "plan"
  | "seats"
  | "seatRequests"
  | "types"
  | "groups"
  | "lists"
  | "priceLists"
  | "orderStatuses"
  | "flowRules"
  | "statusGrid"
  | "itemStates"
  | "orderTemplates"
  | "runSheets"
  | "responsibilities"
  | "paymentMethods"
  | "deposit"
  | "fiscalYear"
  | "accounts"
  | "revenueAccounts"
  | "providers"
  | "apiKeys";

/**
 * Each section's anchor (the `id` its `AdminSection` renders) and the view permission it needs.
 * A new section adds itself here, to its page in `ADMIN_GROUPS` and its texts.
 */
export const ADMIN_SECTIONS: Record<AdminSectionId, { anchor: string; permission: Permission }> = {
  timeZone: { anchor: "time-zone", permission: "configuration:read" },
  domainJoin: { anchor: "domain-join", permission: "configuration:read" },
  members: { anchor: "members", permission: "member:read" },
  invitations: { anchor: "invitations", permission: "member:write" },
  plan: { anchor: "plan", permission: "billing:read" },
  seats: { anchor: "seats", permission: "billing:read" },
  seatRequests: { anchor: "seat-requests", permission: "billing:read" },
  types: { anchor: "types", permission: "configuration:read" },
  groups: { anchor: "groups", permission: "configuration:read" },
  lists: { anchor: "lists", permission: "configuration:read" },
  priceLists: { anchor: "price-lists", permission: "priceList:read" },
  orderStatuses: { anchor: "statuses", permission: "pipeline:read" },
  flowRules: { anchor: "flow-rules", permission: "pipeline:write" },
  statusGrid: { anchor: "status-grid", permission: "pipeline:read" },
  itemStates: { anchor: "item-states", permission: "pipeline:read" },
  orderTemplates: { anchor: "order-templates", permission: "template:read" },
  runSheets: { anchor: "run-sheets", permission: "template:read" },
  responsibilities: { anchor: "responsibilities", permission: "responsibility:read" },
  paymentMethods: { anchor: "payment-methods", permission: "paymentAccount:read" },
  deposit: { anchor: "deposit", permission: "paymentAccount:read" },
  fiscalYear: { anchor: "fiscal-year", permission: "finance:read" },
  accounts: { anchor: "accounts", permission: "finance:read" },
  revenueAccounts: { anchor: "revenue-accounts", permission: "finance:read" },
  providers: { anchor: "providers", permission: "integration:read" },
  apiKeys: { anchor: "api-keys", permission: "apiKey:read" },
};
