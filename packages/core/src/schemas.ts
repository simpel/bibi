/**
 * Client-safe subpath (`@okazi/core/schemas`): ONLY the zod schema files of every feature.
 * No Prisma, fs or operation imports, so client components and `@okazi/ai/ui` can use them
 * without pulling the server into the browser bundle. Add each new feature's `schema.ts` here.
 */
export * from "./features/api-key/schema";
export * from "./features/assignment/schema";
export * from "./features/audit-log/schema";
export * from "./features/configuration/schema";
export * from "./features/contact/schema";
export * from "./features/conversation/schema";
export * from "./features/customer/schema";
export * from "./features/entity-type/behaviour-kinds";
export * from "./features/entity-type/schema";
export * from "./features/field-definition/field-kinds";
export * from "./features/field-definition/field-values-schema";
export * from "./features/field-definition/fields-schema";
export * from "./features/field-definition/schema";
export * from "./features/inbound-email/schema";
export * from "./features/item/choice-group-schema";
export * from "./features/item/package-schema";
export * from "./features/item/resolve-schema";
export * from "./features/item/schema";
export * from "./features/item-state/hold-kind";
export * from "./features/item-state/schema";
export * from "./features/member/schema";
export * from "./features/message/schema";
export * from "./features/oauth-grant/schema";
export * from "./features/occupancy/schema";
export * from "./features/payment/schema";
export * from "./features/payment-account/schema";
export * from "./features/phase-grid/schema";
export * from "./features/pipeline/schema";
export * from "./features/price-list/schema";
export * from "./features/program-item/schema";
export * from "./features/quote/order-line-schema";
export * from "./features/quote/schema";
export * from "./features/requirement/schema";
export * from "./features/responsibility/schema";
export * from "./features/setup/schema";
export * from "./features/sheet/schema";
export * from "./features/sheet-definition/schema";
export * from "./features/skill/schema";
export * from "./features/ticket/create-from-template-schema";
export * from "./features/ticket/export-schema";
export * from "./features/ticket/schema";
export * from "./features/ticket-phase/schema";
export * from "./features/ticket-template/schema";
export * from "./features/user-preference/schema";
export * from "./features/venue/schema";
export * from "./features/vocabulary/schema";
export {
  FIXED_ROLES,
  type FixedRole,
  FixedRoleSchema,
  GRANTABLE_ROLES,
  type GrantableRole,
  GrantableRoleSchema,
  roleRank,
} from "./permissions/fixed-roles";
export { type PermissionSet, PermissionSetSchema } from "./permissions/permission-set";
export {
  PERMISSION_ACTIONS,
  type PermissionAction,
  RESOURCES,
  type Resource,
} from "./permissions/resources";
export * from "./platform/ai-settings/ai-features";
export * from "./platform/ai-settings/schema";
export * from "./platform/system-log/schema";
export * from "./recurrence/plain-date";
export * from "./recurrence/zoned-time";
export * from "./search/search-schema";
