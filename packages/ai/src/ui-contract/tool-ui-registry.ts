import { ACCESS_UI_ENTRIES } from "./access-entries";
import { ALLOCATION_GENERIC_UI_TOOLS } from "./allocation-generic-tools";
import { ALTERNATIVE_GROUP_UI_ENTRIES } from "./alternative-group-entries";
import { ASSIGNMENT_UI_ENTRIES } from "./assignment-entries";
import { BILLING_GENERIC_UI_TOOLS, BILLING_UI_ENTRIES } from "./billing-entries";
import { CONFIGURATION_UI_ENTRIES } from "./configuration-entries";
import { CUSTOMER_UI_ENTRIES } from "./customer-entries";
import { INBOUND_EMAIL_UI_ENTRIES } from "./inbound-email-entries";
import { INBOUND_MESSAGE_UI_ENTRIES } from "./inbound-message-entries";
import { ITEM_RESOLUTION_UI_ENTRIES } from "./item-resolution-entries";
import { ITEM_STATE_UI_ENTRIES } from "./item-state-entries";
import { LINE_UI_ENTRIES } from "./line-entries";
import { MEMBER_PROFILE_UI_ENTRIES } from "./member-profile-entries";
import { NOTIFICATION_UI_ENTRIES } from "./notification-entries";
import { OCCUPANCY_UI_ENTRIES } from "./occupancy-entries";
import { ORDER_UI_ENTRIES } from "./order-entries";
import { ORDER_STATUS_UI_ENTRIES } from "./order-status-entries";
import { ORDER_TEMPLATE_UI_ENTRIES } from "./order-template-entries";
import { PAYMENT_ACCOUNT_UI_ENTRIES } from "./payment-account-entries";
import { PAYMENT_UI_ENTRIES } from "./payment-entries";
import { PERMISSION_UI_ENTRIES } from "./permission-entries";
import { PIPELINE_UI_ENTRIES } from "./pipeline-entries";
import { PIPELINE_SETUP_UI_ENTRIES } from "./pipeline-setup-entries";
import { PRICE_LIST_UI_ENTRIES } from "./price-list-entries";
import { QUESTION_UI_ENTRIES } from "./question-entries";
import { QUOTE_UI_ENTRIES } from "./quote-entries";
import { READ_GENERIC_UI_TOOLS } from "./read-generic-tools";
import { RECEIVABLE_UI_ENTRIES } from "./receivable-entries";
import { REQUIREMENT_UI_ENTRIES } from "./requirement-entries";
import { RESPONSIBILITY_UI_ENTRIES } from "./responsibility-entries";
import { RUN_SHEET_DEFINITION_UI_ENTRIES } from "./run-sheet-definition-entries";
import { RUN_SHEET_UI_ENTRIES } from "./run-sheet-entries";
import { SELF_GENERIC_UI_TOOLS } from "./self-generic-tools";
import { SKILL_UI_ENTRIES } from "./skill-entries";
import { STATUS_GRID_UI_ENTRIES } from "./status-grid-entries";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";
import { SearchWireSchema, VenueListWireSchema, VenueWireSchema } from "./wire-schemas";

const venueTable = uiEntry({
  component: "venue-table",
  schema: VenueListWireSchema,
  toProps: ({ value }) => value,
});
const venueCard = uiEntry({
  component: "venue-card",
  schema: VenueWireSchema,
  toProps: ({ value }) => ({ venue: value }),
});

/**
 * Tool name → generative-UI component. Adding an MCP tool (core operation) forces a decision:
 * add an entry here or list it in `GENERIC_UI_TOOLS` (the parity test fails otherwise).
 */
export const TOOL_UI_REGISTRY: Readonly<Record<string, ToolUiEntry>> = {
  venue_list: venueTable,
  venue_get: venueCard,
  venue_create: venueCard,
  venue_update: venueCard,
  venue_archive: venueCard,
  ...CONFIGURATION_UI_ENTRIES,
  ...ITEM_RESOLUTION_UI_ENTRIES,
  ...CUSTOMER_UI_ENTRIES,
  ...OCCUPANCY_UI_ENTRIES,
  ...PRICE_LIST_UI_ENTRIES,
  ...ORDER_STATUS_UI_ENTRIES,
  ...ORDER_TEMPLATE_UI_ENTRIES,
  ...ITEM_STATE_UI_ENTRIES,
  ...STATUS_GRID_UI_ENTRIES,
  ...ORDER_UI_ENTRIES,
  ...LINE_UI_ENTRIES,
  ...ALTERNATIVE_GROUP_UI_ENTRIES,
  ...ASSIGNMENT_UI_ENTRIES,
  ...REQUIREMENT_UI_ENTRIES,
  ...PIPELINE_UI_ENTRIES,
  ...PIPELINE_SETUP_UI_ENTRIES,
  ...QUOTE_UI_ENTRIES,
  ...INBOUND_EMAIL_UI_ENTRIES,
  ...INBOUND_MESSAGE_UI_ENTRIES,
  ...PAYMENT_ACCOUNT_UI_ENTRIES,
  ...PAYMENT_UI_ENTRIES,
  ...RECEIVABLE_UI_ENTRIES,
  ...RESPONSIBILITY_UI_ENTRIES,
  ...RUN_SHEET_DEFINITION_UI_ENTRIES,
  ...RUN_SHEET_UI_ENTRIES,
  ...ACCESS_UI_ENTRIES,
  ...MEMBER_PROFILE_UI_ENTRIES,
  ...PERMISSION_UI_ENTRIES,
  ...QUESTION_UI_ENTRIES,
  search: uiEntry({
    component: "search-results",
    schema: SearchWireSchema,
    toProps: ({ value }) => value,
  }),
  ...SKILL_UI_ENTRIES,
  ...NOTIFICATION_UI_ENTRIES,
  ...BILLING_UI_ENTRIES,
};

/**
 * Tools deliberately rendered with the generic `json` component (with the reason). Chat
 * bookkeeping is shown by the chat itself; GraphQL results have no fixed shape.
 */
export const GENERIC_UI_TOOLS: Readonly<Record<string, string>> = {
  changeSet_apply: "the approval card shows every step's changes before Confirm (ADR 0049)",
  conversation_list: "chat history UI, not a tool card",
  conversation_get: "chat history UI, not a tool card",
  conversation_create: "chat bookkeeping",
  conversation_rename: "chat bookkeeping",
  conversation_archive: "chat bookkeeping",
  message_list: "chat history UI, not a tool card",
  message_append: "chat bookkeeping",
  memberProfile_list:
    "a list of profiles without member names; the member page shows who is behind a staff item",
  graphql_schema: "SDL text",
  graphql_query: "free-form GraphQL result",
  apiKey_list: "credentials are managed on /settings/integrations, not in chat",
  apiKey_create: "never offered to the assistant (aiAllowed: false): the secret stays out of chat",
  apiKey_revoke: "credentials are managed on /settings/integrations, not in chat",
  apiKey_get: "credentials are managed on /settings/integrations, not in chat",
  apiKey_update: "credentials are managed on /settings/integrations, not in chat",
  ...SELF_GENERIC_UI_TOOLS,
  ...ALLOCATION_GENERIC_UI_TOOLS,
  ...READ_GENERIC_UI_TOOLS,
  ...BILLING_GENERIC_UI_TOOLS,
};
