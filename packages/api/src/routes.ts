import { apiKeyRoutes } from "./features/api-key/rest";
import { assignmentRoutes } from "./features/assignment/rest";
import { auditLogRoutes } from "./features/audit-log/rest";
import { configurationRoutes } from "./features/configuration/rest";
import { contactRoutes } from "./features/contact/rest";
import { conversationRoutes } from "./features/conversation/rest";
import { customerRoutes } from "./features/customer/rest";
import { depositRoutes } from "./features/deposit/rest";
import { entityTypeRoutes } from "./features/entity-type/rest";
import { fieldDefinitionRoutes } from "./features/field-definition/rest";
import { inboundEmailRoutes } from "./features/inbound-email/rest";
import { invoiceRoutes } from "./features/invoice/rest";
import { itemRoutes } from "./features/item/rest";
import { itemStateRoutes } from "./features/item-state/rest";
import { lineRoutes } from "./features/line/rest";
import { memberRoutes } from "./features/member/rest";
import { messageRoutes } from "./features/message/rest";
import { oauthGrantRoutes } from "./features/oauth-grant/rest";
import { occupancyRoutes } from "./features/occupancy/rest";
import { paymentRoutes } from "./features/payment/rest";
import { paymentAccountRoutes } from "./features/payment-account/rest";
import { phaseGridRoutes } from "./features/phase-grid/rest";
import { pipelineRoutes } from "./features/pipeline/rest";
import { pipelineSetupRoutes } from "./features/pipeline-setup/rest";
import { priceListRoutes } from "./features/price-list/rest";
import { quoteRoutes } from "./features/quote/rest";
import { requirementRoutes } from "./features/requirement/rest";
import { responsibilityRoutes } from "./features/responsibility/rest";
import { setupRoutes } from "./features/setup/rest";
import { sheetRoutes } from "./features/sheet/rest";
import { sheetDefinitionRoutes } from "./features/sheet-definition/rest";
import { skillRoutes } from "./features/skill/rest";
import { ticketRoutes } from "./features/ticket/rest";
import { ticketPhaseRoutes } from "./features/ticket-phase/rest";
import { ticketTemplateRoutes } from "./features/ticket-template/rest";
import { userPreferenceRoutes } from "./features/user-preference/rest";
import { venueRoutes } from "./features/venue/rest";
import { vocabularyRoutes } from "./features/vocabulary/rest";
import type { RestRoute } from "./rest-route";
import { searchRoutes } from "./search-rest";

const gridAndSetupRoutes = [...phaseGridRoutes, ...pipelineSetupRoutes];

/** Payments, the receivables they settle (ADR 0057) and the payout account. */
const moneyRoutes = [...paymentAccountRoutes, ...paymentRoutes, ...depositRoutes, ...invoiceRoutes];

/** Every declared REST route; add a feature's routes here when it gets a `rest.ts`. */
export function listRestRoutes(): RestRoute[] {
  return [
    ...venueRoutes,
    ...entityTypeRoutes,
    ...fieldDefinitionRoutes,
    ...vocabularyRoutes,
    ...setupRoutes,
    ...responsibilityRoutes,
    ...assignmentRoutes,
    ...sheetDefinitionRoutes,
    ...configurationRoutes,
    ...itemRoutes,
    ...customerRoutes,
    ...priceListRoutes,
    ...contactRoutes,
    ...occupancyRoutes,
    ...ticketPhaseRoutes,
    ...ticketTemplateRoutes,
    ...itemStateRoutes,
    ...gridAndSetupRoutes,
    ...ticketRoutes,
    ...lineRoutes,
    ...requirementRoutes,
    ...sheetRoutes,
    ...pipelineRoutes,
    ...quoteRoutes,
    ...inboundEmailRoutes,
    ...moneyRoutes,
    ...conversationRoutes,
    ...messageRoutes,
    ...skillRoutes,
    ...memberRoutes,
    ...auditLogRoutes,
    ...apiKeyRoutes,
    ...oauthGrantRoutes,
    ...userPreferenceRoutes,
    ...searchRoutes,
  ];
}

/** Unique names of the core operations exposed over REST (for the parity test). */
export function listRestOperationNames(): string[] {
  return [...new Set(listRestRoutes().map((route) => route.operation))].sort();
}
