import { apiKeyMcpTools } from "../features/api-key/mcp";
import { assignmentMcpTools } from "../features/assignment/mcp";
import { auditLogMcpTools } from "../features/audit-log/mcp";
import { configurationMcpTools } from "../features/configuration/mcp";
import { contactMcpTools } from "../features/contact/mcp";
import { conversationMcpTools } from "../features/conversation/mcp";
import { customerMcpTools } from "../features/customer/mcp";
import { entityTypeMcpTools } from "../features/entity-type/mcp";
import { fieldDefinitionMcpTools } from "../features/field-definition/mcp";
import { inboundEmailMcpTools } from "../features/inbound-email/mcp";
import { itemMcpTools } from "../features/item/mcp";
import { itemStateMcpTools } from "../features/item-state/mcp";
import { memberMcpTools } from "../features/member/mcp";
import { messageMcpTools } from "../features/message/mcp";
import { oauthGrantMcpTools } from "../features/oauth-grant/mcp";
import { occupancyMcpTools } from "../features/occupancy/mcp";
import { paymentMcpTools } from "../features/payment/mcp";
import { paymentAccountMcpTools } from "../features/payment-account/mcp";
import { pipelineMcpTools } from "../features/pipeline/mcp";
import { priceListMcpTools } from "../features/price-list/mcp";
import { programItemMcpTools } from "../features/program-item/mcp";
import { quoteMcpTools } from "../features/quote/mcp";
import { requirementMcpTools } from "../features/requirement/mcp";
import { responsibilityMcpTools } from "../features/responsibility/mcp";
import { setupMcpTools } from "../features/setup/mcp";
import { sheetMcpTools } from "../features/sheet/mcp";
import { sheetDefinitionMcpTools } from "../features/sheet-definition/mcp";
import { skillMcpTools } from "../features/skill/mcp";
import { ticketMcpTools } from "../features/ticket/mcp";
import { ticketPhaseMcpTools } from "../features/ticket-phase/mcp";
import { userPreferenceMcpTools } from "../features/user-preference/mcp";
import { venueMcpTools } from "../features/venue/mcp";
import { vocabularyMcpTools } from "../features/vocabulary/mcp";
import { searchMcpTools } from "../search-mcp";
import type { McpToolMeta } from "./meta";

/** Every declared operation tool; add a feature's tools here when it gets an `mcp.ts`. */
export function listMcpToolMetas(): McpToolMeta[] {
  return [
    ...venueMcpTools,
    ...entityTypeMcpTools,
    ...fieldDefinitionMcpTools,
    ...vocabularyMcpTools,
    ...setupMcpTools,
    ...responsibilityMcpTools,
    ...sheetDefinitionMcpTools,
    ...configurationMcpTools,
    ...itemMcpTools,
    ...customerMcpTools,
    ...priceListMcpTools,
    ...contactMcpTools,
    ...occupancyMcpTools,
    ...ticketPhaseMcpTools,
    ...itemStateMcpTools,
    ...ticketMcpTools,
    ...assignmentMcpTools,
    ...programItemMcpTools,
    ...requirementMcpTools,
    ...sheetMcpTools,
    ...pipelineMcpTools,
    ...quoteMcpTools,
    ...inboundEmailMcpTools,
    ...paymentAccountMcpTools,
    ...paymentMcpTools,
    ...conversationMcpTools,
    ...messageMcpTools,
    ...skillMcpTools,
    ...memberMcpTools,
    ...auditLogMcpTools,
    ...apiKeyMcpTools,
    ...oauthGrantMcpTools,
    ...userPreferenceMcpTools,
    ...searchMcpTools,
  ];
}

export type FindMetaInput = { operation: string };

export function findMcpToolMeta({ operation }: FindMetaInput): McpToolMeta | undefined {
  return listMcpToolMetas().find((meta) => meta.operation === operation);
}
