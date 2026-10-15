import { auditLogMcpTools } from "../features/audit-log/mcp";
import { bookingMcpTools } from "../features/booking/mcp";
import { bookingSeriesMcpTools } from "../features/booking-series/mcp";
import { bookingStatusMcpTools } from "../features/booking-status/mcp";
import { configurationMcpTools } from "../features/configuration/mcp";
import { contactMcpTools } from "../features/contact/mcp";
import { conversationMcpTools } from "../features/conversation/mcp";
import { customerMcpTools } from "../features/customer/mcp";
import { entityTypeMcpTools } from "../features/entity-type/mcp";
import { fieldDefinitionMcpTools } from "../features/field-definition/mcp";
import { inboundEmailMcpTools } from "../features/inbound-email/mcp";
import { inquiryMcpTools } from "../features/inquiry/mcp";
import { itemMcpTools } from "../features/item/mcp";
import { memberMcpTools } from "../features/member/mcp";
import { messageMcpTools } from "../features/message/mcp";
import { occupancyMcpTools } from "../features/occupancy/mcp";
import { paymentMcpTools } from "../features/payment/mcp";
import { paymentAccountMcpTools } from "../features/payment-account/mcp";
import { programItemMcpTools } from "../features/program-item/mcp";
import { roleMcpTools } from "../features/role/mcp";
import { setupMcpTools } from "../features/setup/mcp";
import { sheetDefinitionMcpTools } from "../features/sheet-definition/mcp";
import { skillMcpTools } from "../features/skill/mcp";
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
    ...sheetDefinitionMcpTools,
    ...configurationMcpTools,
    ...itemMcpTools,
    ...customerMcpTools,
    ...contactMcpTools,
    ...occupancyMcpTools,
    ...bookingStatusMcpTools,
    ...bookingMcpTools,
    ...bookingSeriesMcpTools,
    ...programItemMcpTools,
    ...inquiryMcpTools,
    ...inboundEmailMcpTools,
    ...paymentAccountMcpTools,
    ...paymentMcpTools,
    ...conversationMcpTools,
    ...messageMcpTools,
    ...skillMcpTools,
    ...roleMcpTools,
    ...memberMcpTools,
    ...auditLogMcpTools,
    ...searchMcpTools,
  ];
}

export type FindMetaInput = { operation: string };

export function findMcpToolMeta({ operation }: FindMetaInput): McpToolMeta | undefined {
  return listMcpToolMetas().find((meta) => meta.operation === operation);
}
