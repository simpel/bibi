import type { UiComponent } from "@bibi/ai";
import type { ComponentType } from "react";
import { AlternativeGroupCardView } from "./alternative-group-card-view";
import { AlternativeGroupTableView } from "./alternative-group-table-view";
import { ApprovalCardView } from "./approval-card-view";
import { ArchivePreviewCardView } from "./archive-preview-card-view";
import { AssignmentCardView } from "./assignment-card-view";
import { AssignmentTableView } from "./assignment-table-view";
import { AuditLogCardView } from "./audit-log-card-view";
import { AuditLogTableView } from "./audit-log-table-view";
import { BOARD_COMPONENTS } from "./board-components";
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
import { InboundEmailCardView } from "./inbound-email-card-view";
import { InboundEmailTableView } from "./inbound-email-table-view";
import { InvitationCardView } from "./invitation-card-view";
import { InvitationTableView } from "./invitation-table-view";
import { ItemCardView } from "./item-card-view";
import { ItemResolutionCardView } from "./item-resolution-card-view";
import { ItemStateCardView } from "./item-state-card-view";
import { ItemStateTableView } from "./item-state-table-view";
import { ItemTableView } from "./item-table-view";
import { JsonView } from "./json-view";
import { LineCardView } from "./line-card-view";
import { LineTableView } from "./line-table-view";
import { MemberCardView } from "./member-card-view";
import { MemberProfileCardView } from "./member-profile-card-view";
import { MemberTableView } from "./member-table-view";
import { MONEY_COMPONENTS } from "./money-components";
import { OccupancyCardView } from "./occupancy-card-view";
import { OccupancyTableView } from "./occupancy-table-view";
import { PermissionProfileCardView } from "./permission-profile-card-view";
import { PipelineDraftCardView } from "./pipeline-draft-card-view";
import { PipelinePreviewView } from "./pipeline-preview-view";
import { PriceListCardView } from "./price-list-card-view";
import { PriceListTableView } from "./price-list-table-view";
import { QuestionnaireView } from "./questionnaire-view";
import { QuoteCardView } from "./quote-card-view";
import { QuoteTableView } from "./quote-table-view";
import { RequirementCardView } from "./requirement-card-view";
import { RequirementTableView } from "./requirement-table-view";
import { ResponsibilityCardView } from "./responsibility-card-view";
import { ResponsibilityTableView } from "./responsibility-table-view";
import { SearchResultsView } from "./search-results-view";
import { SetupCardView } from "./setup-card-view";
import { SetupTableView } from "./setup-table-view";
import { SheetCardView } from "./sheet-card-view";
import { SheetDefinitionCardView } from "./sheet-definition-card-view";
import { SheetDefinitionTableView } from "./sheet-definition-table-view";
import { SheetTableView } from "./sheet-table-view";
import { SkillCardView } from "./skill-card-view";
import { SkillTableView } from "./skill-table-view";
import { StatusGridTableView } from "./status-grid-table-view";
import { TicketCardView } from "./ticket-card-view";
import { TicketStatusCardView } from "./ticket-status-card-view";
import { TicketStatusHistoryView } from "./ticket-status-history-view";
import { TicketStatusTableView } from "./ticket-status-table-view";
import { TicketTableView } from "./ticket-table-view";
import { TicketTemplateCardView } from "./ticket-template-card-view";
import { TicketTemplateTableView } from "./ticket-template-table-view";
import { VenueCardView } from "./venue-card-view";
import { VenueTableView } from "./venue-table-view";
import { VocabularyCardView } from "./vocabulary-card-view";
import { VocabularyTableView } from "./vocabulary-table-view";

/**
 * One React component per generative-UI key of `@bibi/ai/ui` (`UI_COMPONENTS`). The mapped type
 * makes this exhaustive at compile time: a new key without a component is a type error, and the
 * component's props are the key's `ToolUiProps`.
 */
export const GENERATIVE_COMPONENTS: { [K in UiComponent]: ComponentType<GenerativeProps<K>> } = {
  "venue-table": VenueTableView,
  "venue-card": VenueCardView,
  "item-table": ItemTableView,
  "item-card": ItemCardView,
  "item-resolution-card": ItemResolutionCardView,
  "customer-table": CustomerTableView,
  "customer-card": CustomerCardView,
  "contact-table": ContactTableView,
  "contact-card": ContactCardView,
  "occupancy-table": OccupancyTableView,
  "occupancy-card": OccupancyCardView,
  "price-list-table": PriceListTableView,
  "price-list-card": PriceListCardView,
  "ticket-status-table": TicketStatusTableView,
  "ticket-status-card": TicketStatusCardView,
  "archive-preview-card": ArchivePreviewCardView,
  "ticket-template-table": TicketTemplateTableView,
  "ticket-template-card": TicketTemplateCardView,
  "item-state-table": ItemStateTableView,
  "item-state-card": ItemStateCardView,
  "status-grid-table": StatusGridTableView,
  "pipeline-preview": PipelinePreviewView,
  "pipeline-draft-card": PipelineDraftCardView,
  questionnaire: QuestionnaireView,
  "ticket-table": TicketTableView,
  "ticket-card": TicketCardView,
  "ticket-status-history": TicketStatusHistoryView,
  "line-table": LineTableView,
  "line-card": LineCardView,
  "alternative-group-table": AlternativeGroupTableView,
  "alternative-group-card": AlternativeGroupCardView,
  "requirement-table": RequirementTableView,
  "requirement-card": RequirementCardView,
  ...BOARD_COMPONENTS,
  "quote-card": QuoteCardView,
  "quote-table": QuoteTableView,
  "inbound-email-table": InboundEmailTableView,
  "inbound-email-card": InboundEmailCardView,
  ...MONEY_COMPONENTS,
  "entity-type-table": EntityTypeTableView,
  "entity-type-card": EntityTypeCardView,
  "field-definition-table": FieldDefinitionTableView,
  "field-definition-card": FieldDefinitionCardView,
  "vocabulary-table": VocabularyTableView,
  "vocabulary-card": VocabularyCardView,
  "setup-table": SetupTableView,
  "setup-card": SetupCardView,
  "responsibility-table": ResponsibilityTableView,
  "responsibility-card": ResponsibilityCardView,
  "assignment-table": AssignmentTableView,
  "assignment-card": AssignmentCardView,
  "sheet-definition-table": SheetDefinitionTableView,
  "sheet-definition-card": SheetDefinitionCardView,
  "sheet-table": SheetTableView,
  "sheet-card": SheetCardView,
  "member-table": MemberTableView,
  "member-card": MemberCardView,
  "member-profile-card": MemberProfileCardView,
  "permission-profile-card": PermissionProfileCardView,
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
