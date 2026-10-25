import { alternativeGroupMcpTools } from "../features/alternative-group/mcp";
import { apiKeyMcpTools } from "../features/api-key/mcp";
import { assignmentMcpTools } from "../features/assignment/mcp";
import { auditLogMcpTools } from "../features/audit-log/mcp";
import { calendarMcpTools } from "../features/calendar/mcp";
import { changeSetMcpTools } from "../features/change-set/mcp";
import { configurationMcpTools } from "../features/configuration/mcp";
import { contactMcpTools } from "../features/contact/mcp";
import { conversationMcpTools } from "../features/conversation/mcp";
import { customerMcpTools } from "../features/customer/mcp";
import { depositMcpTools } from "../features/deposit/mcp";
import { entityTypeMcpTools } from "../features/entity-type/mcp";
import { fieldDefinitionMcpTools } from "../features/field-definition/mcp";
import { fileMcpTools } from "../features/file/mcp";
import { inboundEmailMcpTools } from "../features/inbound-email/mcp";
import { invoiceMcpTools } from "../features/invoice/mcp";
import { itemMcpTools } from "../features/item/mcp";
import { itemDemandMcpTools } from "../features/item-demand/mcp";
import { itemStateMcpTools } from "../features/item-state/mcp";
import { lineMcpTools } from "../features/line/mcp";
import { lineAllocationMcpTools } from "../features/line-allocation/mcp";
import { memberMcpTools } from "../features/member/mcp";
import { memberProfileMcpTools } from "../features/member-profile/mcp";
import { messageMcpTools } from "../features/message/mcp";
import { oauthGrantMcpTools } from "../features/oauth-grant/mcp";
import { occupancyMcpTools } from "../features/occupancy/mcp";
import { organizationProfileMcpTools } from "../features/organization-profile/mcp";
import { paymentMcpTools } from "../features/payment/mcp";
import { paymentAccountMcpTools } from "../features/payment-account/mcp";
import { permissionMcpTools } from "../features/permission/mcp";
import { pipelineMcpTools } from "../features/pipeline/mcp";
import { pipelineSetupMcpTools } from "../features/pipeline-setup/mcp";
import { priceListMcpTools } from "../features/price-list/mcp";
import { profileMcpTools } from "../features/profile/mcp";
import { quoteMcpTools } from "../features/quote/mcp";
import { requirementMcpTools } from "../features/requirement/mcp";
import { responsibilityMcpTools } from "../features/responsibility/mcp";
import { setupMcpTools } from "../features/setup/mcp";
import { sheetMcpTools } from "../features/sheet/mcp";
import { sheetDefinitionMcpTools } from "../features/sheet-definition/mcp";
import { skillMcpTools } from "../features/skill/mcp";
import { statusGridMcpTools } from "../features/status-grid/mcp";
import { ticketMcpTools } from "../features/ticket/mcp";
import { ticketStatusMcpTools } from "../features/ticket-status/mcp";
import { ticketTemplateMcpTools } from "../features/ticket-template/mcp";
import { userPreferenceMcpTools } from "../features/user-preference/mcp";
import { venueMcpTools } from "../features/venue/mcp";
import { vocabularyMcpTools } from "../features/vocabulary/mcp";
import { searchMcpTools } from "../search-mcp";
import type { McpToolMeta } from "./meta";

const accessMcpTools = [...memberMcpTools, ...apiKeyMcpTools, ...permissionMcpTools];
const gridAndSetupMcpTools = [
  ...statusGridMcpTools,
  ...pipelineSetupMcpTools,
  ...changeSetMcpTools,
];
const lineAndGroupMcpTools = [
  ...lineMcpTools,
  ...lineAllocationMcpTools,
  ...alternativeGroupMcpTools,
];
/** The read models staff work from: the pipeline board and the calendar. */
const boardMcpTools = [...pipelineMcpTools, ...calendarMcpTools];
const selfMcpTools = [...userPreferenceMcpTools, ...profileMcpTools, ...fileMcpTools];

/** Payments, the receivables they settle (ADR 0057) and the payout account. */
const moneyMcpTools = [
  ...paymentAccountMcpTools,
  ...paymentMcpTools,
  ...depositMcpTools,
  ...invoiceMcpTools,
];

/** The organization's profile and its members' profiles (ADR 0061, 0068). */
const profilesMcpTools = [...organizationProfileMcpTools, ...memberProfileMcpTools];

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
    ...itemDemandMcpTools,
    ...customerMcpTools,
    ...priceListMcpTools,
    ...contactMcpTools,
    ...occupancyMcpTools,
    ...ticketStatusMcpTools,
    ...ticketTemplateMcpTools,
    ...itemStateMcpTools,
    ...gridAndSetupMcpTools,
    ...ticketMcpTools,
    ...assignmentMcpTools,
    ...lineAndGroupMcpTools,
    ...requirementMcpTools,
    ...sheetMcpTools,
    ...boardMcpTools,
    ...quoteMcpTools,
    ...inboundEmailMcpTools,
    ...moneyMcpTools,
    ...conversationMcpTools,
    ...messageMcpTools,
    ...skillMcpTools,
    ...auditLogMcpTools,
    ...accessMcpTools,
    ...oauthGrantMcpTools,
    ...selfMcpTools,
    ...profilesMcpTools,
    ...searchMcpTools,
  ];
}

export type FindMetaInput = { operation: string };

export function findMcpToolMeta({ operation }: FindMetaInput): McpToolMeta | undefined {
  return listMcpToolMetas().find((meta) => meta.operation === operation);
}
