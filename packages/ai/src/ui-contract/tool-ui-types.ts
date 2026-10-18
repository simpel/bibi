import type { ApprovalRequired } from "../approval/approval-schema";
import type { AssignmentWire } from "./assignment-entries";
import type { InboundEmailWire } from "./inbound-email-entries";
import type { ItemResolutionWire } from "./item-resolution-entries";
import type { ItemStateWire } from "./item-state-entries";
import type { PaymentAccountWire } from "./payment-account-entries";
import type { PaymentWire } from "./payment-entries";
import type { PhaseGridCellWire } from "./phase-grid-entries";
import type { PipelineBoardWire } from "./pipeline-entries";
import type { PipelinePreviewWire } from "./pipeline-setup-entries";
import type { PriceListWire } from "./price-list-entries";
import type { ProgramItemWire } from "./program-item-entries";
import type { QuoteWire } from "./quote-entries";
import type { RequirementWire } from "./requirement-entries";
import type { ResponsibilityWire } from "./responsibility-entries";
import type { SheetDefinitionWire } from "./sheet-definition-entries";
import type { SheetWire } from "./sheet-entries";
import type { TicketWire } from "./ticket-entries";
import type { TicketPhaseWire } from "./ticket-phase-entries";
import type { TicketTemplateWire } from "./ticket-template-entries";
import type {
  AuditLogWire,
  ContactWire,
  CustomerWire,
  EntityTypeWire,
  FieldDefinitionWire,
  InvitationWire,
  ItemWire,
  MemberWire,
  OccupancyWire,
  SearchHitWire,
  SetupWire,
  SkillCardWire,
  SkillRow,
  VenueWire,
  VocabularyWire,
} from "./wire-schemas";

/**
 * Generative-UI contract: component key → props. The web maps each key to an `@okazi/ui`
 * component; this package only decides which key and validated props a tool result gets.
 */
export type ToolUiProps = {
  "venue-table": { items: VenueWire[]; nextCursor: string | null };
  "venue-card": { venue: VenueWire };
  "item-table": { items: ItemWire[]; nextCursor: string | null };
  "item-card": { item: ItemWire };
  "item-resolution-card": { resolution: ItemResolutionWire };
  "customer-table": { items: CustomerWire[]; nextCursor: string | null };
  "customer-card": { customer: CustomerWire };
  "contact-table": { items: ContactWire[]; nextCursor: string | null };
  "contact-card": { contact: ContactWire };
  "occupancy-table": { items: OccupancyWire[]; nextCursor: string | null };
  "occupancy-card": { occupancy: OccupancyWire };
  "price-list-table": { items: PriceListWire[]; nextCursor: string | null };
  "price-list-card": { priceList: PriceListWire };
  "ticket-phase-table": { items: TicketPhaseWire[]; nextCursor: string | null };
  "ticket-phase-card": { phase: TicketPhaseWire };
  "ticket-template-table": { items: TicketTemplateWire[]; nextCursor: string | null };
  "ticket-template-card": { template: TicketTemplateWire };
  "item-state-table": { items: ItemStateWire[]; nextCursor: string | null };
  "item-state-card": { state: ItemStateWire };
  "phase-grid-table": { cells: PhaseGridCellWire[] };
  "ticket-table": { items: TicketWire[]; nextCursor: string | null };
  "ticket-card": { ticket: TicketWire };
  "program-item-table": { items: ProgramItemWire[]; nextCursor: string | null };
  "program-item-card": { programItem: ProgramItemWire };
  "requirement-table": { items: RequirementWire[]; nextCursor: string | null };
  "requirement-card": { requirement: RequirementWire };
  "pipeline-board": { board: PipelineBoardWire };
  "pipeline-preview": { preview: PipelinePreviewWire };
  "quote-card": { quote: QuoteWire };
  "quote-table": { items: QuoteWire[]; nextCursor: string | null };
  "inbound-email-table": { items: InboundEmailWire[]; nextCursor: string | null };
  "inbound-email-card": { email: InboundEmailWire };
  "payment-account-card": { account: PaymentAccountWire };
  "payment-table": { items: PaymentWire[]; nextCursor: string | null };
  "payment-card": { payment: PaymentWire };
  "entity-type-table": { items: EntityTypeWire[]; nextCursor: string | null };
  "entity-type-card": { entityType: EntityTypeWire };
  "field-definition-table": { items: FieldDefinitionWire[]; nextCursor: string | null };
  "field-definition-card": { field: FieldDefinitionWire };
  "vocabulary-table": { items: VocabularyWire[]; nextCursor: string | null };
  "vocabulary-card": { vocabulary: VocabularyWire };
  "setup-table": { items: SetupWire[]; nextCursor: string | null };
  "setup-card": { setup: SetupWire };
  "responsibility-table": { items: ResponsibilityWire[]; nextCursor: string | null };
  "responsibility-card": { responsibility: ResponsibilityWire };
  "assignment-table": { items: AssignmentWire[]; nextCursor: string | null };
  "assignment-card": { assignment: AssignmentWire };
  "sheet-definition-table": { items: SheetDefinitionWire[]; nextCursor: string | null };
  "sheet-definition-card": { sheet: SheetDefinitionWire };
  "sheet-table": { items: SheetWire[]; nextCursor: string | null };
  "sheet-card": { sheet: SheetWire };
  "member-table": { items: MemberWire[]; nextCursor: string | null };
  "member-card": { member: MemberWire };
  "invitation-table": { items: InvitationWire[]; nextCursor: string | null };
  "invitation-card": { invitation: InvitationWire };
  "audit-log-table": { items: AuditLogWire[]; nextCursor: string | null };
  "audit-log-card": { entry: AuditLogWire };
  "search-results": { hits: SearchHitWire[] };
  "skill-table": { items: SkillRow[]; nextCursor: string | null };
  "skill-card": { skill: SkillCardWire };
  /** Mutation proposal waiting for the user (see `extractPendingApprovals`). */
  "approval-card": { approval: ApprovalRequired };
  /** Tool error (`isError`): AppError code + message. */
  error: { code: string; message: string };
  /** Fallback: raw JSON of the result. */
  json: { value: unknown };
};

export type UiComponent = keyof ToolUiProps;

/** Discriminated union: `switch (ui.component)` narrows `ui.props`. */
export type ToolUi = { [K in UiComponent]: { component: K; props: ToolUiProps[K] } }[UiComponent];

/** One registry entry: validates a tool's structured result and builds the component props. */
export type ToolUiEntry = {
  component: UiComponent;
  /** `null` when the value does not match (→ `json` fallback). */
  resolve: (input: { value: unknown }) => ToolUi | null;
};
