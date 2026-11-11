import { lexicographicSortSchema, printSchema } from "graphql";
import "../features/venue/graphql";
import "../features/entity-type/graphql";
import "../features/field-definition/graphql";
import "../features/vocabulary/graphql";
import "../features/floor-plan/graphql";
import "../features/responsibility/graphql";
import "../features/run-sheet-definition/graphql";
import "../features/configuration/graphql";
import "../features/item/graphql";
import "../features/item/pool-graphql";
import "../features/item-demand/graphql";
import "../features/item/resolve-graphql";
import "../features/customer/graphql";
import "../features/order-draft/graphql";
import "../features/contact/graphql";
import "../features/price-list/graphql";
import "../features/occupancy/graphql";
import "../features/order-status/graphql";
import "../features/board/graphql";
import "../features/order-template/graphql";
import "../features/order/graphql";
import "../features/order/preview-graphql";
import "../features/line/graphql";
import "../features/line/amounts-graphql";
import "../features/line/issues-graphql";
import "../features/line-allocation/graphql";
import "../features/alternative-group/graphql";
import "../features/item-state/graphql";
import "../features/item-type-group/graphql";
import "../features/status-grid/graphql";
import "../features/pipeline-setup/graphql";
import "../features/change-set/graphql";
import "../features/requirement/graphql";
import "../features/run-sheet/graphql";
import "../features/pipeline/graphql";
import "../features/calendar/graphql";
import "../features/settings/graphql";
import "../features/dashboard/graphql";
import "../features/finance/graphql";
import "../features/finance/export-graphql";
import "../features/quote/graphql";
import "../features/assignment/graphql";
import "../features/inbound-email/graphql";
import "../features/inbound-message/graphql";
import "../features/payment/graphql";
import "../features/deposit/graphql";
import "../features/invoice/graphql";
import "../features/credit-note/graphql";
import "../features/payment-account/graphql";
import "../features/billing/graphql";
import "../features/integration/graphql";
import "../features/conversation/graphql";
import "../features/message/graphql";
import "../features/skill/graphql";
import "../features/member/graphql";
import "../features/audit-log/graphql";
import "../features/api-key/graphql";
import "../features/permission/graphql";
import "../features/oauth-grant/graphql";
import "../features/notification/graphql";
import "../features/notification-preference/graphql";
import "../features/user-preference/graphql";
import "../features/user-settings/graphql";
import "../features/profile/graphql";
import "../features/file/graphql";
import "../features/organization-profile/graphql";
import "../features/member-profile/graphql";
import "./scalars";
import "./search";
import { builder } from "./builder";
import { exposedOperationNames } from "./exposed-operations";

/** The executable schema. Importing this module registers every feature. */
export const schema = builder.toSchema({});

/** SDL for MCP `graphql_schema` and docs; deterministic order. */
export function printSchemaSdl(): string {
  return printSchema(lexicographicSortSchema(schema));
}

/** Operation names (`venue.create`, `search`, ...) exposed as GraphQL queries or mutations. */
export function listGraphqlOperationNames(): string[] {
  return exposedOperationNames();
}
