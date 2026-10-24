import { ACCESS_UI_ENTRIES } from "./access-entries";
import { ALLOCATION_GENERIC_UI_TOOLS } from "./allocation-generic-tools";
import { ALTERNATIVE_GROUP_UI_ENTRIES } from "./alternative-group-entries";
import { ASSIGNMENT_UI_ENTRIES } from "./assignment-entries";
import { CONFIGURATION_UI_ENTRIES } from "./configuration-entries";
import { CUSTOMER_UI_ENTRIES } from "./customer-entries";
import { INBOUND_EMAIL_UI_ENTRIES } from "./inbound-email-entries";
import { ITEM_RESOLUTION_UI_ENTRIES } from "./item-resolution-entries";
import { ITEM_STATE_UI_ENTRIES } from "./item-state-entries";
import { LINE_UI_ENTRIES } from "./line-entries";
import { OCCUPANCY_UI_ENTRIES } from "./occupancy-entries";
import { PAYMENT_ACCOUNT_UI_ENTRIES } from "./payment-account-entries";
import { PAYMENT_UI_ENTRIES } from "./payment-entries";
import { PERMISSION_UI_ENTRIES } from "./permission-entries";
import { PIPELINE_UI_ENTRIES } from "./pipeline-entries";
import { PIPELINE_SETUP_UI_ENTRIES } from "./pipeline-setup-entries";
import { PRICE_LIST_UI_ENTRIES } from "./price-list-entries";
import { QUESTION_UI_ENTRIES } from "./question-entries";
import { QUOTE_UI_ENTRIES } from "./quote-entries";
import { RECEIVABLE_UI_ENTRIES } from "./receivable-entries";
import { REQUIREMENT_UI_ENTRIES } from "./requirement-entries";
import { RESPONSIBILITY_UI_ENTRIES } from "./responsibility-entries";
import { SELF_GENERIC_UI_TOOLS } from "./self-generic-tools";
import { SHEET_DEFINITION_UI_ENTRIES } from "./sheet-definition-entries";
import { SHEET_UI_ENTRIES } from "./sheet-entries";
import { STATUS_GRID_UI_ENTRIES } from "./status-grid-entries";
import { TICKET_UI_ENTRIES } from "./ticket-entries";
import { TICKET_STATUS_UI_ENTRIES } from "./ticket-status-entries";
import { TICKET_TEMPLATE_UI_ENTRIES } from "./ticket-template-entries";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";
import {
  SearchWireSchema,
  SkillCardWireSchema,
  SkillListWireSchema,
  SkillSearchWireSchema,
  VenueListWireSchema,
  VenueWireSchema,
} from "./wire-schemas";

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
const skillCard = uiEntry({
  component: "skill-card",
  schema: SkillCardWireSchema,
  toProps: ({ value }) => ({ skill: value }),
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
  ...TICKET_STATUS_UI_ENTRIES,
  ...TICKET_TEMPLATE_UI_ENTRIES,
  ...ITEM_STATE_UI_ENTRIES,
  ...STATUS_GRID_UI_ENTRIES,
  ...TICKET_UI_ENTRIES,
  ...LINE_UI_ENTRIES,
  ...ALTERNATIVE_GROUP_UI_ENTRIES,
  ...ASSIGNMENT_UI_ENTRIES,
  ...REQUIREMENT_UI_ENTRIES,
  ...PIPELINE_UI_ENTRIES,
  ...PIPELINE_SETUP_UI_ENTRIES,
  ...QUOTE_UI_ENTRIES,
  ...INBOUND_EMAIL_UI_ENTRIES,
  ...PAYMENT_ACCOUNT_UI_ENTRIES,
  ...PAYMENT_UI_ENTRIES,
  ...RECEIVABLE_UI_ENTRIES,
  ...RESPONSIBILITY_UI_ENTRIES,
  ...SHEET_DEFINITION_UI_ENTRIES,
  ...SHEET_UI_ENTRIES,
  ...ACCESS_UI_ENTRIES,
  ...PERMISSION_UI_ENTRIES,
  ...QUESTION_UI_ENTRIES,
  search: uiEntry({
    component: "search-results",
    schema: SearchWireSchema,
    toProps: ({ value }) => value,
  }),
  skill_list: uiEntry({
    component: "skill-table",
    schema: SkillListWireSchema,
    toProps: ({ value }) => value,
  }),
  skill_get: skillCard,
  skill_create: skillCard,
  skill_update: skillCard,
  skill_publish: skillCard,
  skill_archive: skillCard,
  skill_share: skillCard,
  skill_import: skillCard,
  load_skill: skillCard,
  skill_search: uiEntry({
    component: "skill-table",
    schema: SkillSearchWireSchema,
    toProps: ({ value }) => ({ items: value.skills, nextCursor: null }),
  }),
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
  item_freeUnits:
    "a list of unit names with the prepick; shown as JSON until the allocation UI (#384)",
  skill_export: "SKILL.md text; shown as code/JSON",
  ticket_export: "versioned JSON document for handover; shown as code/JSON",
  graphql_schema: "SDL text",
  graphql_query: "free-form GraphQL result",
  apiKey_list: "credentials are managed on /settings/integrations, not in chat",
  apiKey_create: "never offered to the assistant (aiAllowed: false): the secret stays out of chat",
  apiKey_revoke: "credentials are managed on /settings/integrations, not in chat",
  apiKey_get: "credentials are managed on /settings/integrations, not in chat",
  apiKey_update: "credentials are managed on /settings/integrations, not in chat",
  ...SELF_GENERIC_UI_TOOLS,
  ...ALLOCATION_GENERIC_UI_TOOLS,
};
