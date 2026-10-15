import type { UiComponent } from "@okazi/ai";
import type { ComponentType } from "react";
import { ApprovalCardView } from "./approval-card-view";
import { AuditLogCardView } from "./audit-log-card-view";
import { AuditLogTableView } from "./audit-log-table-view";
import { BookingCardView } from "./booking-card-view";
import { BookingStatusCardView } from "./booking-status-card-view";
import { BookingStatusTableView } from "./booking-status-table-view";
import { BookingTableView } from "./booking-table-view";
import { ContactCardView } from "./contact-card-view";
import { ContactTableView } from "./contact-table-view";
import { CustomerCardView } from "./customer-card-view";
import { CustomerTableView } from "./customer-table-view";
import { EntityTypeCardView } from "./entity-type-card-view";
import { EntityTypeTableView } from "./entity-type-table-view";
import { ErrorView } from "./error-view";
import { FieldDefinitionCardView } from "./field-definition-card-view";
import { FieldDefinitionTableView } from "./field-definition-table-view";
import type { GenerativeProps } from "./generative-props";
import { InvitationCardView } from "./invitation-card-view";
import { InvitationTableView } from "./invitation-table-view";
import { ItemCardView } from "./item-card-view";
import { ItemTableView } from "./item-table-view";
import { JsonView } from "./json-view";
import { MemberCardView } from "./member-card-view";
import { MemberTableView } from "./member-table-view";
import { OccupancyCardView } from "./occupancy-card-view";
import { OccupancyTableView } from "./occupancy-table-view";
import { RoleCardView } from "./role-card-view";
import { RoleTableView } from "./role-table-view";
import { SearchResultsView } from "./search-results-view";
import { SetupCardView } from "./setup-card-view";
import { SetupTableView } from "./setup-table-view";
import { SheetDefinitionCardView } from "./sheet-definition-card-view";
import { SheetDefinitionTableView } from "./sheet-definition-table-view";
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
  "customer-table": CustomerTableView,
  "customer-card": CustomerCardView,
  "contact-table": ContactTableView,
  "contact-card": ContactCardView,
  "occupancy-table": OccupancyTableView,
  "occupancy-card": OccupancyCardView,
  "booking-status-table": BookingStatusTableView,
  "booking-status-card": BookingStatusCardView,
  "booking-table": BookingTableView,
  "booking-card": BookingCardView,
  "entity-type-table": EntityTypeTableView,
  "entity-type-card": EntityTypeCardView,
  "field-definition-table": FieldDefinitionTableView,
  "field-definition-card": FieldDefinitionCardView,
  "vocabulary-table": VocabularyTableView,
  "vocabulary-card": VocabularyCardView,
  "setup-table": SetupTableView,
  "setup-card": SetupCardView,
  "sheet-definition-table": SheetDefinitionTableView,
  "sheet-definition-card": SheetDefinitionCardView,
  "role-table": RoleTableView,
  "role-card": RoleCardView,
  "member-table": MemberTableView,
  "member-card": MemberCardView,
  "invitation-table": InvitationTableView,
  "invitation-card": InvitationCardView,
  "audit-log-table": AuditLogTableView,
  "audit-log-card": AuditLogCardView,
  "search-results": SearchResultsView,
  "skill-table": SkillTableView,
  "skill-card": SkillCardView,
  "approval-card": ApprovalCardView,
  error: ErrorView,
  json: JsonView,
};
