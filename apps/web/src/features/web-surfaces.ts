import { MONEY_SURFACES } from "./money-surfaces";
import { SALES_SURFACES } from "./sales-surfaces";
import { SETTINGS_SURFACES } from "./settings-surfaces";

/**
 * Which core operations have a UI surface in the web app. The parity test in
 * `web-surfaces.test.ts` validates this list: a new operation must either appear in
 * `WEB_SURFACES` (with the route or component that exposes it) or be listed in `UI_EXEMPT`
 * (`ui-exempt.ts`) with a reason.
 */
export type WebSurface = {
  /** Core operation name, e.g. `venue.create`. */
  operation: string;
  /**
   * Route pattern below `src/app/[locale]/(app)`, e.g. `/venues/[id]`, or `"*"` for UI that
   * lives in the app shell on every page (then `component` names the file).
   */
  route: string;
  /** With `route: "*"`: the component file below `src/` that provides the UI. */
  component?: string;
};

/** The assistant (conversation history, rename, archive, chat) lives on the start page. */
const PANEL = { route: "/" } as const;

export const WEB_SURFACES: readonly WebSurface[] = [
  // The pipeline board: tickets by phase, moved by drag (ADR 0041, 0043).
  { operation: "pipeline.board", route: "/pipeline" },
  { operation: "venue.list", route: "/venues" },
  { operation: "venue.get", route: "/venues/[id]" },
  { operation: "venue.create", route: "/venues" },
  { operation: "venue.update", route: "/venues/[id]" },
  { operation: "venue.archive", route: "/venues/[id]" },
  { operation: "item.list", route: "/items" },
  { operation: "item.get", route: "/items/[id]" },
  // The expanded parts and inherited list values of a composed item (ADR 0021).
  { operation: "item.resolve", route: "/items/[id]" },
  { operation: "item.create", route: "/new/item" },
  { operation: "item.update", route: "/items/[id]/update" },
  { operation: "item.archive", route: "/items/[id]" },
  // A bookable item's occupancy is listed and its manual blocks edited on the item page.
  { operation: "occupancy.list", route: "/items/[id]" },
  // The calendar shows the occupancy of every space by day or week.
  { operation: "occupancy.list", route: "/calendar" },
  { operation: "occupancy.create", route: "/items/[id]" },
  { operation: "occupancy.update", route: "/items/[id]" },
  { operation: "occupancy.archive", route: "/items/[id]" },
  { operation: "customer.list", route: "/customers" },
  { operation: "customer.get", route: "/customers/[id]" },
  { operation: "customer.create", route: "/customers" },
  { operation: "customer.update", route: "/customers/[id]" },
  { operation: "customer.archive", route: "/customers/[id]" },
  { operation: "item.saveAsPackage", route: "/customers/[id]" },
  // Contact persons are listed and edited on their customer's page.
  { operation: "contact.list", route: "/customers/[id]" },
  { operation: "contact.create", route: "/customers/[id]" },
  { operation: "contact.update", route: "/customers/[id]" },
  { operation: "contact.archive", route: "/customers/[id]" },
  { operation: "ticket.list", route: "/tickets" },
  { operation: "ticket.create", route: "/new/ticket" },
  { operation: "ticket.createFromTemplate", route: "/new/ticket" },
  { operation: "ticket.get", route: "/tickets/[id]" },
  { operation: "ticket.update", route: "/tickets/[id]/update" },
  { operation: "ticket.changePhase", route: "/tickets/[id]" },
  { operation: "ticket.export", route: "/tickets/[id]" },
  { operation: "inboundEmail.list", route: "/tickets/[id]" },
  // The run schedule (lines) is listed and edited on the ticket page.
  { operation: "line.list", route: "/tickets/[id]" },
  { operation: "line.create", route: "/tickets/[id]" },
  { operation: "line.update", route: "/tickets/[id]" },
  { operation: "line.archive", route: "/tickets/[id]" },
  // A line's state is changed (override) or set to follow the phase from its row (ADR 0044).
  { operation: "line.changeState", route: "/tickets/[id]" },
  { operation: "line.followPhase", route: "/tickets/[id]" },
  { operation: "requirement.list", route: "/tickets/[id]" },
  { operation: "requirement.create", route: "/tickets/[id]" },
  { operation: "requirement.update", route: "/tickets/[id]" },
  { operation: "requirement.archive", route: "/tickets/[id]" },
  { operation: "sheet.list", route: "/tickets/[id]" },
  { operation: "sheet.generate", route: "/tickets/[id]" },
  { operation: "sheet.send", route: "/tickets/[id]" },
  ...SALES_SURFACES,
  ...MONEY_SURFACES,
  ...SETTINGS_SURFACES,
  { operation: "entityType.list", route: "/settings/types" },
  { operation: "entityType.create", route: "/new/type" },
  { operation: "configuration.importTemplate", route: "/settings/types" },
  { operation: "entityType.get", route: "/settings/types/[id]" },
  { operation: "entityType.update", route: "/settings/types/[id]" },
  { operation: "entityType.archive", route: "/settings/types/[id]" },
  { operation: "fieldDefinition.list", route: "/settings/types/[id]" },
  { operation: "fieldDefinition.get", route: "/settings/types/[id]" },
  { operation: "fieldDefinition.create", route: "/settings/types/[id]" },
  { operation: "fieldDefinition.update", route: "/settings/types/[id]" },
  { operation: "fieldDefinition.archive", route: "/settings/types/[id]" },
  { operation: "vocabulary.list", route: "/settings/lists" },
  { operation: "vocabulary.create", route: "/settings/lists" },
  { operation: "vocabulary.importTemplate", route: "/settings/lists" },
  { operation: "vocabulary.get", route: "/settings/lists/[id]" },
  { operation: "vocabulary.update", route: "/settings/lists/[id]" },
  { operation: "vocabulary.archive", route: "/settings/lists/[id]" },
  { operation: "vocabulary.addValue", route: "/settings/lists/[id]" },
  { operation: "vocabulary.updateValue", route: "/settings/lists/[id]" },
  { operation: "vocabulary.archiveValue", route: "/settings/lists/[id]" },
  { operation: "setup.list", route: "/settings/setups" },
  { operation: "setup.get", route: "/settings/setups" },
  { operation: "setup.create", route: "/settings/setups" },
  { operation: "setup.update", route: "/settings/setups" },
  { operation: "setup.archive", route: "/settings/setups" },
  { operation: "responsibility.list", route: "/settings/responsibilities" },
  { operation: "responsibility.get", route: "/settings/responsibilities" },
  { operation: "responsibility.create", route: "/settings/responsibilities" },
  { operation: "responsibility.update", route: "/settings/responsibilities" },
  { operation: "responsibility.archive", route: "/settings/responsibilities" },
  { operation: "sheetDefinition.list", route: "/settings/sheets" },
  { operation: "sheetDefinition.get", route: "/settings/sheets" },
  { operation: "sheetDefinition.create", route: "/settings/sheets" },
  { operation: "sheetDefinition.update", route: "/settings/sheets" },
  { operation: "sheetDefinition.archive", route: "/settings/sheets" },
  { operation: "ticketPhase.list", route: "/settings/pipeline" },
  { operation: "ticketPhase.get", route: "/settings/pipeline" },
  { operation: "ticketPhase.create", route: "/settings/pipeline" },
  { operation: "ticketPhase.update", route: "/settings/pipeline" },
  { operation: "ticketPhase.archive", route: "/settings/pipeline" },
  { operation: "ticketPhase.archivePreview", route: "/settings/pipeline" },
  { operation: "ticketPhase.reorder", route: "/settings/pipeline" },
  { operation: "ticketPhase.setTransitions", route: "/settings/pipeline" },
  { operation: "ticketPhase.importTemplate", route: "/settings/pipeline" },
  { operation: "search", route: "/venues" },
  { operation: "skill.list", route: "/skills" },
  { operation: "skill.get", route: "/skills/[id]" },
  { operation: "skill.create", route: "/new/skill" },
  { operation: "skill.update", route: "/skills/[id]/update" },
  { operation: "skill.publish", route: "/skills/[id]" },
  { operation: "skill.archive", route: "/skills/[id]" },
  { operation: "skill.share", route: "/skills/[id]" },
  { operation: "skill.export", route: "/skills/[id]" },
  { operation: "skill.import", route: "/skills" },
  // The history tab on venue and item detail pages (and later every entity's detail page).
  { operation: "auditLog.list", route: "/items/[id]" },
  // `/api/chat` creates chats and appends messages as the user; the panel lists, opens, renames.
  { operation: "conversation.list", ...PANEL },
  { operation: "conversation.get", ...PANEL },
  { operation: "conversation.create", ...PANEL },
  { operation: "conversation.rename", ...PANEL },
  { operation: "conversation.archive", ...PANEL },
  { operation: "message.list", ...PANEL },
  { operation: "message.append", ...PANEL },
];
