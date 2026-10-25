import { alternativeGroupRoutes } from "./features/alternative-group/rest";
import { apiKeyRoutes } from "./features/api-key/rest";
import { assignmentRoutes } from "./features/assignment/rest";
import { auditLogRoutes } from "./features/audit-log/rest";
import { changeSetRoutes } from "./features/change-set/rest";
import { configurationRoutes } from "./features/configuration/rest";
import { contactRoutes } from "./features/contact/rest";
import { conversationRoutes } from "./features/conversation/rest";
import { customerRoutes } from "./features/customer/rest";
import { depositRoutes } from "./features/deposit/rest";
import { entityTypeRoutes } from "./features/entity-type/rest";
import { fieldDefinitionRoutes } from "./features/field-definition/rest";
import { fileRoutes } from "./features/file/rest";
import { inboundEmailRoutes } from "./features/inbound-email/rest";
import { invoiceRoutes } from "./features/invoice/rest";
import { itemRoutes } from "./features/item/rest";
import { itemDemandRoutes } from "./features/item-demand/rest";
import { itemStateRoutes } from "./features/item-state/rest";
import { lineRoutes } from "./features/line/rest";
import { lineAllocationRoutes } from "./features/line-allocation/rest";
import { memberRoutes } from "./features/member/rest";
import { memberProfileRoutes } from "./features/member-profile/rest";
import { messageRoutes } from "./features/message/rest";
import { oauthGrantRoutes } from "./features/oauth-grant/rest";
import { occupancyRoutes } from "./features/occupancy/rest";
import { organizationProfileRoutes } from "./features/organization-profile/rest";
import { paymentRoutes } from "./features/payment/rest";
import { paymentAccountRoutes } from "./features/payment-account/rest";
import { permissionRoutes } from "./features/permission/rest";
import { pipelineRoutes } from "./features/pipeline/rest";
import { pipelineSetupRoutes } from "./features/pipeline-setup/rest";
import { priceListRoutes } from "./features/price-list/rest";
import { profileRoutes } from "./features/profile/rest";
import { quoteRoutes } from "./features/quote/rest";
import { requirementRoutes } from "./features/requirement/rest";
import { responsibilityRoutes } from "./features/responsibility/rest";
import { setupRoutes } from "./features/setup/rest";
import { sheetRoutes } from "./features/sheet/rest";
import { sheetDefinitionRoutes } from "./features/sheet-definition/rest";
import { skillRoutes } from "./features/skill/rest";
import { statusGridRoutes } from "./features/status-grid/rest";
import { ticketRoutes } from "./features/ticket/rest";
import { ticketStatusRoutes } from "./features/ticket-status/rest";
import { ticketTemplateRoutes } from "./features/ticket-template/rest";
import { userPreferenceRoutes } from "./features/user-preference/rest";
import { venueRoutes } from "./features/venue/rest";
import { vocabularyRoutes } from "./features/vocabulary/rest";
import type { RestRoute } from "./rest-route";
import { searchRoutes } from "./search-rest";

const accessRoutes = [...memberRoutes, ...apiKeyRoutes, ...permissionRoutes];
const gridAndSetupRoutes = [...statusGridRoutes, ...pipelineSetupRoutes, ...changeSetRoutes];
const lineAndGroupRoutes = [...lineRoutes, ...lineAllocationRoutes, ...alternativeGroupRoutes];
const selfRoutes = [...userPreferenceRoutes, ...profileRoutes, ...fileRoutes];

/** Payments, the receivables they settle (ADR 0057) and the payout account. */
const moneyRoutes = [...paymentAccountRoutes, ...paymentRoutes, ...depositRoutes, ...invoiceRoutes];

/** The organization's profile and its members' profiles (ADR 0061, 0068). */
const organizationAndMemberProfileRoutes = [...organizationProfileRoutes, ...memberProfileRoutes];

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
    ...itemDemandRoutes,
    ...customerRoutes,
    ...priceListRoutes,
    ...contactRoutes,
    ...occupancyRoutes,
    ...ticketStatusRoutes,
    ...ticketTemplateRoutes,
    ...itemStateRoutes,
    ...gridAndSetupRoutes,
    ...ticketRoutes,
    ...lineAndGroupRoutes,
    ...requirementRoutes,
    ...sheetRoutes,
    ...pipelineRoutes,
    ...quoteRoutes,
    ...inboundEmailRoutes,
    ...moneyRoutes,
    ...conversationRoutes,
    ...messageRoutes,
    ...skillRoutes,
    ...auditLogRoutes,
    ...accessRoutes,
    ...oauthGrantRoutes,
    ...selfRoutes,
    ...organizationAndMemberProfileRoutes,
    ...searchRoutes,
  ];
}

/** Unique names of the core operations exposed over REST (for the parity test). */
export function listRestOperationNames(): string[] {
  return [...new Set(listRestRoutes().map((route) => route.operation))].sort();
}
