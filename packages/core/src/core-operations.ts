import { alternativeGroupOperations } from "./features/alternative-group/operations";
import { apiKeyOperations } from "./features/api-key/operations";
import { assignmentOperations } from "./features/assignment/operations";
import { auditLogOperations } from "./features/audit-log/operations";
import { configurationOperations } from "./features/configuration/operations";
import { contactOperations } from "./features/contact/operations";
import { conversationOperations } from "./features/conversation/operations";
import { customerOperations } from "./features/customer/operations";
import { depositOperations } from "./features/deposit/operations";
import { entityTypeOperations } from "./features/entity-type/operations";
import { fieldDefinitionOperations } from "./features/field-definition/operations";
import { inboundEmailOperations } from "./features/inbound-email/operations";
import { invoiceOperations } from "./features/invoice/operations";
import { itemOperations } from "./features/item/operations";
import { itemStateOperations } from "./features/item-state/operations";
import { lineOperations } from "./features/line/operations";
import { memberOperations } from "./features/member/operations";
import { messageOperations } from "./features/message/operations";
import { oauthGrantOperations } from "./features/oauth-grant/operations";
import { occupancyOperations } from "./features/occupancy/operations";
import { paymentOperations } from "./features/payment/operations";
import { paymentAccountOperations } from "./features/payment-account/operations";
import { phaseGridOperations } from "./features/phase-grid/operations";
import { pipelineOperations } from "./features/pipeline/operations";
import { pipelineSetupOperations } from "./features/pipeline-setup/operations";
import { priceListOperations } from "./features/price-list/operations";
import { quoteOperations } from "./features/quote/operations";
import { requirementOperations } from "./features/requirement/operations";
import { responsibilityOperations } from "./features/responsibility/operations";
import { setupOperations } from "./features/setup/operations";
import { sheetOperations } from "./features/sheet/operations";
import { sheetDefinitionOperations } from "./features/sheet-definition/operations";
import { skillOperations } from "./features/skill/operations";
import { ticketOperations } from "./features/ticket/operations";
import { ticketPhaseOperations } from "./features/ticket-phase/operations";
import { ticketTemplateOperations } from "./features/ticket-template/operations";
import { userPreferenceOperations } from "./features/user-preference/operations";
import { venueOperations } from "./features/venue/operations";
import { vocabularyOperations } from "./features/vocabulary/operations";
import type { AnyOperation } from "./operations/types";
import type { EmbedFn } from "./search/embed";
import { createSearchOperation } from "./search/search-operation";

export type CreateCoreOperationsInput = { embed: EmbedFn };

const pipelineGroupOperations = [...pipelineOperations, ...pipelineSetupOperations];
const lineGroupOperations = [...lineOperations, ...alternativeGroupOperations];

/** Payments, the receivables they settle (ADR 0057) and the payout account. */
const moneyOperations = [
  ...paymentAccountOperations,
  ...paymentOperations,
  ...depositOperations,
  ...invoiceOperations,
];

/** Every operation core ships; adapters register this list so surfaces stay in parity. */
export function createCoreOperations({ embed }: CreateCoreOperationsInput): AnyOperation[] {
  return [
    ...venueOperations,
    ...entityTypeOperations,
    ...fieldDefinitionOperations,
    ...vocabularyOperations,
    ...setupOperations,
    ...responsibilityOperations,
    ...sheetDefinitionOperations,
    ...configurationOperations,
    ...itemOperations,
    ...customerOperations,
    ...contactOperations,
    ...priceListOperations,
    ...occupancyOperations,
    ...ticketPhaseOperations,
    ...ticketTemplateOperations,
    ...itemStateOperations,
    ...phaseGridOperations,
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
    ...userPreferenceOperations,
    createSearchOperation({ embed }),
  ];
}
