import { alternativeGroupMcpTools } from "../features/alternative-group/mcp";
import { apiKeyMcpTools } from "../features/api-key/mcp";
import { assignmentMcpTools } from "../features/assignment/mcp";
import { auditLogMcpTools } from "../features/audit-log/mcp";
import { boardCrudMcpTools, boardPhaseMcpTools } from "../features/board/mcp";
import { calendarMcpTools } from "../features/calendar/mcp";
import { changeSetMcpTools } from "../features/change-set/mcp";
import { configurationMcpTools } from "../features/configuration/mcp";
import { contactMcpTools } from "../features/contact/mcp";
import { conversationMcpTools } from "../features/conversation/mcp";
import { customerMcpTools } from "../features/customer/mcp";
import { dashboardMcpTools } from "../features/dashboard/mcp";
import { entityTypeMcpTools } from "../features/entity-type/mcp";
import { fieldDefinitionMcpTools } from "../features/field-definition/mcp";
import { fileMcpTools } from "../features/file/mcp";
import { financeMcpTools } from "../features/finance/mcp";
import { floorPlanMcpTools } from "../features/floor-plan/mcp";
import { inboundMessageMcpTools } from "../features/inbound-message/mcp";
import { itemMcpTools } from "../features/item/mcp";
import { itemDemandMcpTools } from "../features/item-demand/mcp";
import { itemStateMcpTools } from "../features/item-state/mcp";
import { lineMcpTools } from "../features/line/mcp";
import { lineAllocationMcpTools } from "../features/line-allocation/mcp";
import { memberMcpTools } from "../features/member/mcp";
import { memberProfileMcpTools } from "../features/member-profile/mcp";
import { messageMcpTools } from "../features/message/mcp";
import { notificationMcpTools } from "../features/notification/mcp";
import { notificationPreferenceMcpTools } from "../features/notification-preference/mcp";
import { oauthGrantMcpTools } from "../features/oauth-grant/mcp";
import { occupancyMcpTools } from "../features/occupancy/mcp";
import { orderMcpTools } from "../features/order/mcp";
import { orderDraftMcpTools } from "../features/order-draft/mcp";
import { orderStatusMcpTools } from "../features/order-status/mcp";
import { orderTemplateMcpTools } from "../features/order-template/mcp";
import { organizationProfileMcpTools } from "../features/organization-profile/mcp";
import { permissionMcpTools } from "../features/permission/mcp";
import { pipelineMcpTools } from "../features/pipeline/mcp";
import { pipelineSetupMcpTools } from "../features/pipeline-setup/mcp";
import { priceListMcpTools } from "../features/price-list/mcp";
import { profileMcpTools } from "../features/profile/mcp";
import { quoteMcpTools } from "../features/quote/mcp";
import { requirementMcpTools } from "../features/requirement/mcp";
import { responsibilityMcpTools } from "../features/responsibility/mcp";
import { runSheetMcpTools } from "../features/run-sheet/mcp";
import { runSheetDefinitionMcpTools } from "../features/run-sheet-definition/mcp";
import { setupMcpTools } from "../features/setup/mcp";
import { skillMcpTools } from "../features/skill/mcp";
import { statusGridMcpTools } from "../features/status-grid/mcp";
import { userPreferenceMcpTools } from "../features/user-preference/mcp";
import { userSettingsMcpTools } from "../features/user-settings/mcp";
import { venueMcpTools } from "../features/venue/mcp";
import { vocabularyMcpTools } from "../features/vocabulary/mcp";
import { searchMcpTools } from "../search-mcp";
import type { McpToolMeta } from "./meta";
import { moneyMcpTools } from "./money-mcp-tools";

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
/** The read models staff work from: the pipeline board, the calendar and the financials. */
const boardMcpTools = [
  ...pipelineMcpTools,
  ...calendarMcpTools,
  ...dashboardMcpTools,
  ...financeMcpTools,
  ...boardCrudMcpTools,
  ...boardPhaseMcpTools,
];
const selfMcpTools = [
  ...notificationMcpTools,
  ...notificationPreferenceMcpTools,
  ...userPreferenceMcpTools,
  ...userSettingsMcpTools,
  ...profileMcpTools,
  ...fileMcpTools,
];

/** The organization's profile and its members' profiles (ADR 0061, 0068). */
const profilesMcpTools = [...organizationProfileMcpTools, ...memberProfileMcpTools];

/** Customers and the order draft read from a message (ADR 0081, 0084). */
const intakeMcpTools = [...customerMcpTools, ...orderDraftMcpTools];

/** Every declared operation tool; add a feature's tools here when it gets an `mcp.ts`. */
export function listMcpToolMetas(): McpToolMeta[] {
  return [
    ...venueMcpTools,
    ...entityTypeMcpTools,
    ...fieldDefinitionMcpTools,
    ...vocabularyMcpTools,
    ...setupMcpTools,
    ...floorPlanMcpTools,
    ...responsibilityMcpTools,
    ...runSheetDefinitionMcpTools,
    ...configurationMcpTools,
    ...itemMcpTools,
    ...itemDemandMcpTools,
    ...intakeMcpTools,
    ...priceListMcpTools,
    ...contactMcpTools,
    ...occupancyMcpTools,
    ...orderStatusMcpTools,
    ...orderTemplateMcpTools,
    ...itemStateMcpTools,
    ...gridAndSetupMcpTools,
    ...orderMcpTools,
    ...assignmentMcpTools,
    ...lineAndGroupMcpTools,
    ...requirementMcpTools,
    ...runSheetMcpTools,
    ...boardMcpTools,
    ...quoteMcpTools,
    ...inboundMessageMcpTools,
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
