/**
 * Client-safe subpath (`@okazi/core/schemas`): ONLY the zod schema files of every feature.
 * No Prisma, fs or operation imports, so client components and `@okazi/ai/ui` can use them
 * without pulling the server into the browser bundle. Add each new feature's `schema.ts` here.
 */
export * from "./features/audit-log/schema";
export * from "./features/booking/schema";
export * from "./features/booking-status/schema";
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
export * from "./features/item/schema";
export * from "./features/member/schema";
export * from "./features/message/schema";
export * from "./features/occupancy/schema";
export * from "./features/role/schema";
export * from "./features/setup/schema";
export * from "./features/sheet-definition/schema";
export * from "./features/skill/schema";
export * from "./features/venue/schema";
export * from "./features/vocabulary/schema";
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
export * from "./recurrence/expand-occurrences-schema";
export * from "./recurrence/recurrence-rule-schema";
export * from "./recurrence/rrule-string-schema";
export * from "./search/search-schema";
