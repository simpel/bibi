import type { ApprovalRequired } from "../approval/approval-schema";
import type { AskedQuestion } from "../questions/question-schema";
import type { AlternativeGroupWire } from "./alternative-group-entries";
import type { ArchivePreviewWire } from "./archive-preview-entry";
import type { AssignmentWire } from "./assignment-entries";
import type { BoardUiProps } from "./board-entries";
import type { CalendarRangeWire } from "./calendar-entries";
import type { DashboardUiProps } from "./dashboard-ui-props";
import type { FinanceUiProps } from "./finance-ui-props";
import type { HoursWire } from "./hours-entries";
import type { InboundUiProps } from "./inbound-message-entries";
import type { ItemResolutionWire } from "./item-resolution-entries";
import type { ItemStateWire } from "./item-state-entries";
import type { LineWire } from "./line-entries";
import type { MemberProfileWire } from "./member-profile-entries";
import type { NotificationUiProps } from "./notification-entries";
import type { OrderToolUiProps } from "./order-entries";
import type { OrderStatusWire } from "./order-status-entries";
import type { OrderTemplateWire } from "./order-template-entries";
import type { IntegrationWire, PaymentAccountWire } from "./payment-account-entries";
import type { OrderBalanceWire, PaymentWire } from "./payment-entries";
import type { PermissionProfileWire } from "./permission-entries";
import type { PipelineBoardWire } from "./pipeline-entries";
import type { PipelinePreviewWire, PipelineSetupDraftWire } from "./pipeline-setup-entries";
import type { PriceListWire } from "./price-list-entries";
import type { QuoteWire } from "./quote-entries";
import type { DepositWire, InvoiceWire } from "./receivable-entries";
import type { RequirementWire } from "./requirement-entries";
import type { ResponsibilityWire } from "./responsibility-entries";
import type { RunSheetDefinitionWire } from "./run-sheet-definition-entries";
import type { RunSheetWire } from "./run-sheet-entries";
import type { SettingsUiProps } from "./settings-entries";
import type { SkillUiProps } from "./skill-entries";
import type { StatusGridCellWire } from "./status-grid-entries";
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
  VenueWire,
  VocabularyWire,
} from "./wire-schemas";

/**
 * Generative-UI contract: component key → props. The web maps each key to an `@bibi/ui`
 * component; this package only decides which key and validated props a tool result gets.
 */
export type ToolUiProps = BoardUiProps &
  InboundUiProps &
  NotificationUiProps &
  SkillUiProps &
  SettingsUiProps &
  DashboardUiProps &
  FinanceUiProps &
  OrderToolUiProps & {
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
    "order-status-table": { items: OrderStatusWire[]; nextCursor: string | null };
    "order-status-card": { orderStatus: OrderStatusWire };
    "archive-preview-card": { preview: ArchivePreviewWire };
    "order-template-table": { items: OrderTemplateWire[]; nextCursor: string | null };
    "order-template-card": { template: OrderTemplateWire };
    "item-state-table": { items: ItemStateWire[]; nextCursor: string | null };
    "item-state-card": { state: ItemStateWire };
    "status-grid-table": { cells: StatusGridCellWire[] };
    "line-table": { items: LineWire[]; nextCursor: string | null };
    "line-card": { line: LineWire };
    "alternative-group-table": { items: AlternativeGroupWire[]; nextCursor: string | null };
    "alternative-group-card": { group: AlternativeGroupWire };
    "requirement-table": { items: RequirementWire[]; nextCursor: string | null };
    "requirement-card": { requirement: RequirementWire };
    "pipeline-board": { board: PipelineBoardWire };
    "calendar-range": { range: CalendarRangeWire };
    "hours-card": { hours: HoursWire };
    "pipeline-preview": { preview: PipelinePreviewWire };
    "pipeline-draft-card": { draft: PipelineSetupDraftWire };
    /** A question to the user (`ask_question`); the answer is the next chat message. */
    questionnaire: { question: AskedQuestion };
    "quote-card": { quote: QuoteWire };
    "quote-table": { items: QuoteWire[]; nextCursor: string | null };
    "payment-account-card": { account: PaymentAccountWire };
    "integration-card": { items: IntegrationWire[]; authorizeUrl: string | null };
    "payment-table": { items: PaymentWire[]; nextCursor: string | null };
    "payment-card": { payment: PaymentWire };
    "payment-refund-card": { payment: PaymentWire };
    "order-balance-card": { balance: OrderBalanceWire };
    "deposit-table": { items: DepositWire[]; nextCursor: string | null };
    "deposit-card": { deposit: DepositWire };
    "invoice-table": { items: InvoiceWire[]; nextCursor: string | null };
    "invoice-card": { invoice: InvoiceWire };
    "credit-note-card": { invoice: InvoiceWire };
    "entity-type-table": { items: EntityTypeWire[]; nextCursor: string | null };
    "entity-type-card": { entityType: EntityTypeWire };
    "field-definition-table": { items: FieldDefinitionWire[]; nextCursor: string | null };
    "field-definition-card": { field: FieldDefinitionWire };
    "vocabulary-table": { items: VocabularyWire[]; nextCursor: string | null };
    "vocabulary-card": { vocabulary: VocabularyWire };
    "responsibility-table": { items: ResponsibilityWire[]; nextCursor: string | null };
    "responsibility-card": { responsibility: ResponsibilityWire };
    "assignment-table": { items: AssignmentWire[]; nextCursor: string | null };
    "assignment-card": { assignment: AssignmentWire };
    "run-sheet-definition-table": { items: RunSheetDefinitionWire[]; nextCursor: string | null };
    "run-sheet-definition-card": { runSheet: RunSheetDefinitionWire };
    "run-sheet-table": { items: RunSheetWire[]; nextCursor: string | null };
    "run-sheet-card": { runSheet: RunSheetWire };
    "member-table": { items: MemberWire[]; nextCursor: string | null };
    "member-card": { member: MemberWire };
    "member-profile-card": { profile: MemberProfileWire };
    "permission-profile-card": { profile: PermissionProfileWire };
    "invitation-table": { items: InvitationWire[]; nextCursor: string | null };
    "invitation-card": { invitation: InvitationWire };
    "audit-log-table": { items: AuditLogWire[]; nextCursor: string | null };
    "audit-log-card": { entry: AuditLogWire };
    "search-results": { hits: SearchHitWire[] };
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
