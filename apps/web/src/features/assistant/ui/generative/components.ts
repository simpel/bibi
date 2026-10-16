import type { UiComponent } from "@okazi/ai";
import type { ComponentType } from "react";
import { ApprovalCardView } from "./approval-card-view";
import { AuditLogCardView } from "./audit-log-card-view";
import { AuditLogTableView } from "./audit-log-table-view";
import { BookingCardView } from "./booking-card-view";
import { BookingSeriesCardView } from "./booking-series-card-view";
import { BookingSeriesTableView } from "./booking-series-table-view";
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
import { InboundEmailCardView } from "./inbound-email-card-view";
import { InboundEmailTableView } from "./inbound-email-table-view";
import { InquiryCardView } from "./inquiry-card-view";
import { InquiryTableView } from "./inquiry-table-view";
import { InvitationCardView } from "./invitation-card-view";
import { InvitationTableView } from "./invitation-table-view";
import { ItemCardView } from "./item-card-view";
import { ItemResolutionCardView } from "./item-resolution-card-view";
import { ItemTableView } from "./item-table-view";
import { JsonView } from "./json-view";
import { MemberCardView } from "./member-card-view";
import { MemberTableView } from "./member-table-view";
import { OccupancyCardView } from "./occupancy-card-view";
import { OccupancyTableView } from "./occupancy-table-view";
import { OptionCardView } from "./option-card-view";
import { OptionQueueView } from "./option-queue-view";
import { PaymentAccountCardView } from "./payment-account-card-view";
import { PaymentCardView } from "./payment-card-view";
import { PaymentTableView } from "./payment-table-view";
import { PriceListCardView } from "./price-list-card-view";
import { PriceListTableView } from "./price-list-table-view";
import { ProgramItemCardView } from "./program-item-card-view";
import { ProgramItemTableView } from "./program-item-table-view";
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
  "item-resolution-card": ItemResolutionCardView,
  "customer-table": CustomerTableView,
  "customer-card": CustomerCardView,
  "contact-table": ContactTableView,
  "contact-card": ContactCardView,
  "occupancy-table": OccupancyTableView,
  "occupancy-card": OccupancyCardView,
  "price-list-table": PriceListTableView,
  "price-list-card": PriceListCardView,
  "booking-status-table": BookingStatusTableView,
  "booking-status-card": BookingStatusCardView,
  "booking-table": BookingTableView,
  "booking-card": BookingCardView,
  "booking-series-table": BookingSeriesTableView,
  "booking-series-card": BookingSeriesCardView,
  "program-item-table": ProgramItemTableView,
  "program-item-card": ProgramItemCardView,
  "requirement-table": RequirementTableView,
  "requirement-card": RequirementCardView,
  "inquiry-table": InquiryTableView,
  "inquiry-card": InquiryCardView,
  "option-card": OptionCardView,
  "option-queue": OptionQueueView,
  "quote-card": QuoteCardView,
  "quote-table": QuoteTableView,
  "inbound-email-table": InboundEmailTableView,
  "inbound-email-card": InboundEmailCardView,
  "payment-account-card": PaymentAccountCardView,
  "payment-table": PaymentTableView,
  "payment-card": PaymentCardView,
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
  "sheet-definition-table": SheetDefinitionTableView,
  "sheet-definition-card": SheetDefinitionCardView,
  "sheet-table": SheetTableView,
  "sheet-card": SheetCardView,
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
