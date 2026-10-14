import type { UiComponent } from "@okazi/ai";
import type { ComponentType } from "react";
import { ApprovalCardView } from "./approval-card-view";
import { EntityTypeCardView } from "./entity-type-card-view";
import { EntityTypeTableView } from "./entity-type-table-view";
import { ErrorView } from "./error-view";
import { FieldDefinitionCardView } from "./field-definition-card-view";
import { FieldDefinitionTableView } from "./field-definition-table-view";
import type { GenerativeProps } from "./generative-props";
import { ItemCardView } from "./item-card-view";
import { ItemTableView } from "./item-table-view";
import { JsonView } from "./json-view";
import { MemberCardView } from "./member-card-view";
import { MemberTableView } from "./member-table-view";
import { RoleCardView } from "./role-card-view";
import { RoleTableView } from "./role-table-view";
import { SearchResultsView } from "./search-results-view";
import { SetupCardView } from "./setup-card-view";
import { SetupTableView } from "./setup-table-view";
import { SkillCardView } from "./skill-card-view";
import { SkillTableView } from "./skill-table-view";
import { VenueCardView } from "./venue-card-view";
import { VenueTableView } from "./venue-table-view";
import { VocabularyCardView } from "./vocabulary-card-view";
import { VocabularyTableView } from "./vocabulary-table-view";

/**
 * One React component per generative-UI key of `@okazi/ai/ui` (`UI_COMPONENTS`). The mapped type
 * makes this exhaustive at compile time: a new key without a component is a type error, and the
 * component's props are the key's `ToolUiProps`.
 */
export const GENERATIVE_COMPONENTS: { [K in UiComponent]: ComponentType<GenerativeProps<K>> } = {
  "venue-table": VenueTableView,
  "venue-card": VenueCardView,
  "item-table": ItemTableView,
  "item-card": ItemCardView,
  "entity-type-table": EntityTypeTableView,
  "entity-type-card": EntityTypeCardView,
  "field-definition-table": FieldDefinitionTableView,
  "field-definition-card": FieldDefinitionCardView,
  "vocabulary-table": VocabularyTableView,
  "vocabulary-card": VocabularyCardView,
  "setup-table": SetupTableView,
  "setup-card": SetupCardView,
  "role-table": RoleTableView,
  "role-card": RoleCardView,
  "member-table": MemberTableView,
  "member-card": MemberCardView,
  "search-results": SearchResultsView,
  "skill-table": SkillTableView,
  "skill-card": SkillCardView,
  "approval-card": ApprovalCardView,
  error: ErrorView,
  json: JsonView,
};
