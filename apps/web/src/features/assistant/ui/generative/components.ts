import type { UiComponent } from "@okazi/ai";
import type { ComponentType } from "react";
import { ApprovalCardView } from "./approval-card-view";
import { ErrorView } from "./error-view";
import type { GenerativeProps } from "./generative-props";
import { JsonView } from "./json-view";
import { MemberCardView } from "./member-card-view";
import { MemberTableView } from "./member-table-view";
import { RoleCardView } from "./role-card-view";
import { RoleTableView } from "./role-table-view";
import { RoomCardView } from "./room-card-view";
import { RoomTableView } from "./room-table-view";
import { SearchResultsView } from "./search-results-view";
import { SkillCardView } from "./skill-card-view";
import { SkillTableView } from "./skill-table-view";
import { VenueCardView } from "./venue-card-view";
import { VenueTableView } from "./venue-table-view";

/**
 * One React component per generative-UI key of `@okazi/ai/ui` (`UI_COMPONENTS`). The mapped type
 * makes this exhaustive at compile time: a new key without a component is a type error, and the
 * component's props are the key's `ToolUiProps`.
 */
export const GENERATIVE_COMPONENTS: { [K in UiComponent]: ComponentType<GenerativeProps<K>> } = {
  "venue-table": VenueTableView,
  "venue-card": VenueCardView,
  "room-table": RoomTableView,
  "room-card": RoomCardView,
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
