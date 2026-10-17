import { auditLogOperations } from "./features/audit-log/operations";
import { bookingOperations } from "./features/booking/operations";
import { bookingSeriesOperations } from "./features/booking-series/operations";
import { bookingStatusOperations } from "./features/booking-status/operations";
import { configurationOperations } from "./features/configuration/operations";
import { contactOperations } from "./features/contact/operations";
import { conversationOperations } from "./features/conversation/operations";
import { customerOperations } from "./features/customer/operations";
import { entityTypeOperations } from "./features/entity-type/operations";
import { fieldDefinitionOperations } from "./features/field-definition/operations";
import { inboundEmailOperations } from "./features/inbound-email/operations";
import { inquiryOperations } from "./features/inquiry/operations";
import { itemOperations } from "./features/item/operations";
import { memberOperations } from "./features/member/operations";
import { messageOperations } from "./features/message/operations";
import { occupancyOperations } from "./features/occupancy/operations";
import { paymentOperations } from "./features/payment/operations";
import { paymentAccountOperations } from "./features/payment-account/operations";
import { priceListOperations } from "./features/price-list/operations";
import { programItemOperations } from "./features/program-item/operations";
import { requirementOperations } from "./features/requirement/operations";
import { roleOperations } from "./features/role/operations";
import { setupOperations } from "./features/setup/operations";
import { sheetOperations } from "./features/sheet/operations";
import { sheetDefinitionOperations } from "./features/sheet-definition/operations";
import { skillOperations } from "./features/skill/operations";
import { venueOperations } from "./features/venue/operations";
import { vocabularyOperations } from "./features/vocabulary/operations";
import type { AnyOperation } from "./operations/types";
import type { EmbedFn } from "./search/embed";
import { createSearchOperation } from "./search/search-operation";

export type CreateCoreOperationsInput = { embed: EmbedFn };

/** Every operation core ships; adapters register this list so surfaces stay in parity. */
export function createCoreOperations({ embed }: CreateCoreOperationsInput): AnyOperation[] {
  return [
    ...venueOperations,
    ...entityTypeOperations,
    ...fieldDefinitionOperations,
    ...vocabularyOperations,
    ...setupOperations,
    ...sheetDefinitionOperations,
    ...configurationOperations,
    ...itemOperations,
    ...customerOperations,
    ...contactOperations,
    ...priceListOperations,
    ...occupancyOperations,
    ...bookingStatusOperations,
    ...bookingOperations,
    ...bookingSeriesOperations,
    ...programItemOperations,
    ...requirementOperations,
    ...sheetOperations,
    ...inquiryOperations,
    ...inboundEmailOperations,
    ...paymentAccountOperations,
    ...paymentOperations,
    ...conversationOperations,
    ...messageOperations,
    ...skillOperations,
    ...roleOperations,
    ...memberOperations,
    ...auditLogOperations,
    createSearchOperation({ embed }),
  ];
}
