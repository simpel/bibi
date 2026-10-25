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
import { depositOperations } from "./features/deposit/operations";
import { entityTypeOperations } from "./features/entity-type/operations";
import { fieldDefinitionOperations } from "./features/field-definition/operations";
import { fileOperations } from "./features/file/operations";
import { inboundEmailOperations } from "./features/inbound-email/operations";
import { invoiceOperations } from "./features/invoice/operations";
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
import { organizationProfileOperations } from "./features/organization-profile/operations";
import { paymentOperations } from "./features/payment/operations";
import { paymentAccountOperations } from "./features/payment-account/operations";
import { permissionOperations } from "./features/permission/operations";
import { pipelineOperations } from "./features/pipeline/operations";
import { pipelineSetupOperations } from "./features/pipeline-setup/operations";
import { priceListOperations } from "./features/price-list/operations";
import { profileOperations } from "./features/profile/operations";
import { quoteOperations } from "./features/quote/operations";
import { requirementOperations } from "./features/requirement/operations";
import { responsibilityOperations } from "./features/responsibility/operations";
import { setupOperations } from "./features/setup/operations";
import { sheetOperations } from "./features/sheet/operations";
import { sheetDefinitionOperations } from "./features/sheet-definition/operations";
import { skillOperations } from "./features/skill/operations";
import { statusGridOperations } from "./features/status-grid/operations";
import { ticketOperations } from "./features/ticket/operations";
import { ticketStatusOperations } from "./features/ticket-status/operations";
import { ticketTemplateOperations } from "./features/ticket-template/operations";
import { userPreferenceOperations } from "./features/user-preference/operations";
import { userSettingsOperations } from "./features/user-settings/operations";
import { venueOperations } from "./features/venue/operations";
import { vocabularyOperations } from "./features/vocabulary/operations";
import type { AnyOperation } from "./operations/types";
import type { EmbedFn } from "./search/embed";
import { createSearchOperation } from "./search/search-operation";

export type CreateCoreOperationsInput = { embed: EmbedFn };

const pipelineGroupOperations = [
  ...pipelineOperations,
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

/** Payments, the receivables they settle (ADR 0057) and the payout account. */
const moneyOperations = [
  ...paymentAccountOperations,
  ...paymentOperations,
  ...depositOperations,
  ...invoiceOperations,
];

/** What occupies bookable items and the calendar that shows it (ADR 0022, 0064). */
const bookingOperations = [...occupancyOperations, ...calendarOperations];

/**
 * The caller's own data: preferences, settings, profile, working hours and files
 * (ADR 0039, 0046, 0061, 0063).
 */
const selfOperations = [
  ...userPreferenceOperations,
  ...userSettingsOperations,
  ...profileOperations,
  ...fileOperations,
];

/** Every operation that does not depend on the app's `embed` (all but `search`). */
function staticOperations(): AnyOperation[] {
  return [
    ...venueOperations,
    ...entityTypeOperations,
    ...fieldDefinitionOperations,
    ...vocabularyOperations,
    ...setupOperations,
    ...permissionOperations,
    ...responsibilityOperations,
    ...sheetDefinitionOperations,
    ...configurationOperations,
    ...itemGroupOperations,
    ...customerOperations,
    ...contactOperations,
    ...priceListOperations,
    ...bookingOperations,
    ...ticketStatusOperations,
    ...ticketTemplateOperations,
    ...itemStateOperations,
    ...statusGridOperations,
    ...ticketOperations,
    ...lineGroupOperations,
    ...assignmentOperations,
    ...requirementOperations,
    ...sheetOperations,
    ...pipelineGroupOperations,
    ...quoteOperations,
    ...inboundEmailOperations,
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
