import { InboundEmailCardView } from "./inbound-email-card-view";
import { InboundEmailTableView } from "./inbound-email-table-view";
import { InboundMessageCardView } from "./inbound-message-card-view";
import { InboundMessageTableView } from "./inbound-message-table-view";

/** What came in from outside: messages of every channel and the old mail cards (ADR 0085). */
export const INBOUND_COMPONENTS = {
  "inbound-email-table": InboundEmailTableView,
  "inbound-email-card": InboundEmailCardView,
  "inbound-message-table": InboundMessageTableView,
  "inbound-message-card": InboundMessageCardView,
} as const;
