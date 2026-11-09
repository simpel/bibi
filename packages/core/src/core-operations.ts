import { alternativeGroupOperations } from "./features/alternative-group/operations";
import { apiKeyOperations } from "./features/api-key/operations";
import { assignmentOperations } from "./features/assignment/operations";
import { auditLogOperations } from "./features/audit-log/operations";
import { calendarOperations } from "./features/calendar/operations";
import { changeSetOperations } from "./features/change-set/operations";
import { configurationOperations } from "./features/configuration/operations";
import { contactOperations } from "./features/contact/operations";
import { conversationOperations } from "./features/conversation/operations";
import { customerOperations } from "./features/customer/operations";
import { dashboardOperations } from "./features/dashboard/operations";
import { entityTypeOperations } from "./features/entity-type/operations";
import { fieldDefinitionOperations } from "./features/field-definition/operations";
import { floorPlanOperations } from "./features/floor-plan/operations";
import { inboundMessageOperations } from "./features/inbound-message/operations";
import { itemOperations } from "./features/item/operations";
import { itemDemandOperations } from "./features/item-demand/operations";
import { itemStateOperations } from "./features/item-state/operations";
import { lineOperations } from "./features/line/operations";
import { lineAllocationOperations } from "./features/line-allocation/operations";
import { memberOperations } from "./features/member/operations";
import { memberProfileOperations } from "./features/member-profile/operations";
import { messageOperations } from "./features/message/operations";
import { oauthGrantOperations } from "./features/oauth-grant/operations";
import { occupancyOperations } from "./features/occupancy/operations";
import { orderOperations } from "./features/order/operations";
import { orderStatusOperations } from "./features/order-status/operations";
import { orderTemplateOperations } from "./features/order-template/operations";
import { organizationProfileOperations } from "./features/organization-profile/operations";
import { permissionOperations } from "./features/permission/operations";
import { pipelineOperations } from "./features/pipeline/operations";
import { pipelineSetupOperations } from "./features/pipeline-setup/operations";
import { priceListOperations } from "./features/price-list/operations";
import { quoteOperations } from "./features/quote/operations";
import { requirementOperations } from "./features/requirement/operations";
import { responsibilityOperations } from "./features/responsibility/operations";
import { runSheetOperations } from "./features/run-sheet/operations";
import { runSheetDefinitionOperations } from "./features/run-sheet-definition/operations";
import { settingsOperations } from "./features/settings/operations";
import { setupOperations } from "./features/setup/operations";
import { skillOperations } from "./features/skill/operations";
import { statusGridOperations } from "./features/status-grid/operations";
import { venueOperations } from "./features/venue/operations";
import { vocabularyOperations } from "./features/vocabulary/operations";
import { hoursOperations } from "./hours/operations";
import { moneyOperations } from "./money-operations";
import type { AnyOperation } from "./operations/types";
import type { EmbedFn } from "./search/embed";
import { createSearchOperation } from "./search/search-operation";
import { selfOperations } from "./self-operations";

export type CreateCoreOperationsInput = { embed: EmbedFn };

const pipelineGroupOperations = [
  ...pipelineOperations,
  ...dashboardOperations,
  ...pipelineSetupOperations,
  ...changeSetOperations,
];
/** Items and what they ask of pools (ADR 0059). */
const itemGroupOperations = [
  ...itemOperations,
  ...itemDemandOperations,
  ...memberProfileOperations,
];
const lineGroupOperations = [
  ...lineOperations,
  ...lineAllocationOperations,
  ...alternativeGroupOperations,
];

/** What occupies bookable items, their hours and the calendar (ADR 0022, 0064). */
const bookingOperations = [...occupancyOperations, ...calendarOperations, ...hoursOperations];

/** Every operation that does not depend on the app's `embed` (all but `search`). */
function staticOperations(): AnyOperation[] {
  return [
    ...venueOperations,
    ...entityTypeOperations,
    ...fieldDefinitionOperations,
    ...vocabularyOperations,
    ...setupOperations,
    ...floorPlanOperations,
    ...permissionOperations,
    ...responsibilityOperations,
    ...runSheetDefinitionOperations,
    ...configurationOperations,
    ...settingsOperations,
    ...itemGroupOperations,
    ...customerOperations,
    ...contactOperations,
    ...priceListOperations,
    ...bookingOperations,
    ...orderStatusOperations,
    ...orderTemplateOperations,
    ...itemStateOperations,
    ...statusGridOperations,
    ...orderOperations,
    ...lineGroupOperations,
    ...assignmentOperations,
    ...requirementOperations,
    ...runSheetOperations,
    ...pipelineGroupOperations,
    ...quoteOperations,
    ...inboundMessageOperations,
    ...moneyOperations,
    ...conversationOperations,
    ...messageOperations,
    ...skillOperations,
    ...memberOperations,
    ...auditLogOperations,
    ...apiKeyOperations,
    ...oauthGrantOperations,
    ...selfOperations,
    ...organizationProfileOperations,
  ];
}

let byName: Map<string, AnyOperation> | undefined;

/** A static operation by name, e.g. a change set step (ADR 0049); the same on every surface. */
export function findStaticOperation({ name }: { name: string }): AnyOperation | undefined {
  byName ??= new Map(staticOperations().map((operation) => [operation.name, operation]));
  return byName.get(name);
}

/** Every operation core ships; adapters register this list so surfaces stay in parity. */
export function createCoreOperations({ embed }: CreateCoreOperationsInput): AnyOperation[] {
  return [...staticOperations(), createSearchOperation({ embed })];
}
