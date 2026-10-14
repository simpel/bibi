import { apiKeyRoutes } from "./features/api-key/rest";
import { assignmentRoutes } from "./features/assignment/rest";
import { auditLogRoutes } from "./features/audit-log/rest";
import { bookingRoutes } from "./features/booking/rest";
import { bookingSeriesRoutes } from "./features/booking-series/rest";
import { bookingStatusRoutes } from "./features/booking-status/rest";
import { configurationRoutes } from "./features/configuration/rest";
import { contactRoutes } from "./features/contact/rest";
import { conversationRoutes } from "./features/conversation/rest";
import { customerRoutes } from "./features/customer/rest";
import { entityTypeRoutes } from "./features/entity-type/rest";
import { fieldDefinitionRoutes } from "./features/field-definition/rest";
import { inboundEmailRoutes } from "./features/inbound-email/rest";
import { inquiryRoutes } from "./features/inquiry/rest";
import { itemRoutes } from "./features/item/rest";
import { memberRoutes } from "./features/member/rest";
import { messageRoutes } from "./features/message/rest";
import { oauthGrantRoutes } from "./features/oauth-grant/rest";
import { occupancyRoutes } from "./features/occupancy/rest";
import { optionRoutes } from "./features/option/rest";
import { paymentRoutes } from "./features/payment/rest";
import { paymentAccountRoutes } from "./features/payment-account/rest";
import { priceListRoutes } from "./features/price-list/rest";
import { programItemRoutes } from "./features/program-item/rest";
import { quoteRoutes } from "./features/quote/rest";
import { requirementRoutes } from "./features/requirement/rest";
import { responsibilityRoutes } from "./features/responsibility/rest";
import { setupRoutes } from "./features/setup/rest";
import { sheetRoutes } from "./features/sheet/rest";
import { sheetDefinitionRoutes } from "./features/sheet-definition/rest";
import { skillRoutes } from "./features/skill/rest";
import { venueRoutes } from "./features/venue/rest";
import { vocabularyRoutes } from "./features/vocabulary/rest";
import type { RestRoute } from "./rest-route";
import { searchRoutes } from "./search-rest";

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
    ...bookingStatusRoutes,
    ...bookingRoutes,
    ...bookingSeriesRoutes,
    ...programItemRoutes,
    ...requirementRoutes,
    ...sheetRoutes,
    ...inquiryRoutes,
    ...optionRoutes,
    ...quoteRoutes,
    ...inboundEmailRoutes,
    ...paymentAccountRoutes,
    ...paymentRoutes,
    ...conversationRoutes,
    ...messageRoutes,
    ...skillRoutes,
    ...memberRoutes,
    ...auditLogRoutes,
    ...apiKeyRoutes,
    ...oauthGrantRoutes,
    ...searchRoutes,
  ];
}

/** Unique names of the core operations exposed over REST (for the parity test). */
export function listRestOperationNames(): string[] {
  return [...new Set(listRestRoutes().map((route) => route.operation))].sort();
}
