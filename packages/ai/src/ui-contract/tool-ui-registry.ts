import { ACCESS_UI_ENTRIES } from "./access-entries";
import { CONFIGURATION_UI_ENTRIES } from "./configuration-entries";
import { CUSTOMER_UI_ENTRIES } from "./customer-entries";
import { OCCUPANCY_UI_ENTRIES } from "./occupancy-entries";
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
  ...CUSTOMER_UI_ENTRIES,
  ...OCCUPANCY_UI_ENTRIES,
  ...ACCESS_UI_ENTRIES,
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
  conversation_list: "chat history UI, not a tool card",
  conversation_get: "chat history UI, not a tool card",
  conversation_create: "chat bookkeeping",
  conversation_rename: "chat bookkeeping",
  conversation_archive: "chat bookkeeping",
  message_list: "chat history UI, not a tool card",
  message_append: "chat bookkeeping",
  skill_export: "SKILL.md text; shown as code/JSON",
  graphql_schema: "SDL text",
  graphql_query: "free-form GraphQL result",
};
