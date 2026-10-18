import { lexicographicSortSchema, printSchema } from "graphql";
import "../features/venue/graphql";
import "../features/entity-type/graphql";
import "../features/field-definition/graphql";
import "../features/vocabulary/graphql";
import "../features/setup/graphql";
import "../features/responsibility/graphql";
import "../features/sheet-definition/graphql";
import "../features/configuration/graphql";
import "../features/item/graphql";
import "../features/item/resolve-graphql";
import "../features/customer/graphql";
import "../features/contact/graphql";
import "../features/price-list/graphql";
import "../features/occupancy/graphql";
import "../features/booking-status/graphql";
import "../features/booking/graphql";
import "../features/program-item/graphql";
import "../features/requirement/graphql";
import "../features/sheet/graphql";
import "../features/inquiry/graphql";
import "../features/pipeline/graphql";
import "../features/option/graphql";
import "../features/quote/graphql";
import "../features/assignment/graphql";
import "../features/inbound-email/graphql";
import "../features/payment/graphql";
import "../features/payment-account/graphql";
import "../features/conversation/graphql";
import "../features/message/graphql";
import "../features/skill/graphql";
import "../features/member/graphql";
import "../features/audit-log/graphql";
import "../features/api-key/graphql";
import "../features/oauth-grant/graphql";
import "../features/user-preference/graphql";
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
