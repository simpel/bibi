import { BOOKING_SURFACES } from "./booking-surfaces";
import { MONEY_SURFACES } from "./money-surfaces";
import { PIPELINE_SURFACES } from "./pipeline-surfaces";
import { SALES_SURFACES } from "./sales-surfaces";
import { SETTINGS_SURFACES } from "./settings-surfaces";
import { WELCOME_SURFACES } from "./welcome-surfaces";

/**
 * Which core operations have a UI surface in the web app (checked by `web-surfaces.test.ts`): a
 * new operation appears in `WEB_SURFACES` or in `UI_EXEMPT` (`ui-exempt.ts`) with a reason.
 */
export type WebSurface = {
  /** Core operation name, e.g. `venue.create`. */
  operation: string;
  /**
   * Route pattern below `src/app/[locale]/[org]/(app)` or `[org]` (the welcome flow), e.g.
   * `/venues/[id]`, or `"*"` for UI in the app shell on every page (`component` names the file).
   */
  route: string;
  /** With `route: "*"`: the component file below `src/` that provides the UI. */
  component?: string;
};

/** The assistant (conversation history, rename, archive, chat) lives on the start page. */
const PANEL = { route: "/" } as const;
export const WEB_SURFACES: readonly WebSurface[] = [
  ...PIPELINE_SURFACES,
  { operation: "calendar.range", route: "/calendar" },
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
  { operation: "occupancy.create", route: "/items/[id]" },
  { operation: "occupancy.update", route: "/items/[id]" },
  { operation: "occupancy.archive", route: "/items/[id]" },
  { operation: "customer.list", route: "/customers" },
  { operation: "customer.get", route: "/customers/[id]" },
  { operation: "customer.create", route: "/customers" },
  { operation: "customer.update", route: "/customers/[id]" },
  { operation: "customer.archive", route: "/customers/[id]" },
  { operation: "item.saveAsBundle", route: "/customers/[id]" },
  // Contact persons are listed and edited on their customer's page.
  { operation: "contact.list", route: "/customers/[id]" },
  { operation: "contact.create", route: "/customers/[id]" },
  { operation: "contact.update", route: "/customers/[id]" },
  { operation: "contact.archive", route: "/customers/[id]" },
  { operation: "order.list", route: "/orders" },
  { operation: "order.create", route: "/new/order" },
  { operation: "order.get", route: "/orders/[id]" },
  // The order page's first paint in one read (ADR 0097).
  { operation: "order.view", route: "/orders/[id]" },
  { operation: "order.update", route: "/orders/[id]/update" },
  { operation: "order.changeStatus", route: "/orders/[id]" },
  // The run schedule (lines) is listed and edited on the order page.
  { operation: "line.list", route: "/orders/[id]" },
  { operation: "line.amounts", route: "/orders/[id]" },
  { operation: "line.issues", route: "/orders/[id]" },
  { operation: "line.create", route: "/orders/[id]" },
  { operation: "line.update", route: "/orders/[id]" },
  { operation: "line.archive", route: "/orders/[id]" },
  // A line's state is changed (override) or set to follow the status from its row (ADR 0044).
  { operation: "line.changeState", route: "/orders/[id]" },
  { operation: "line.followStatus", route: "/orders/[id]" },
  { operation: "requirement.list", route: "/orders/[id]" },
  { operation: "requirement.create", route: "/orders/[id]" },
  { operation: "requirement.update", route: "/orders/[id]" },
  { operation: "requirement.archive", route: "/orders/[id]" },
  { operation: "runSheet.list", route: "/run-sheets" },
  { operation: "runSheet.get", route: "/run-sheets/[id]" },
  { operation: "runSheet.generate", route: "/orders/[id]" },
  { operation: "runSheet.publish", route: "/orders/[id]" },
  { operation: "runSheet.fulfill", route: "/run-sheets/[id]" },
  { operation: "runSheet.unfulfill", route: "/run-sheets/[id]" },
  ...BOOKING_SURFACES,
  ...SALES_SURFACES,
  ...MONEY_SURFACES,
  ...SETTINGS_SURFACES,
  ...WELCOME_SURFACES,
  { operation: "entityType.list", route: "/admin/types" },
  { operation: "entityType.create", route: "/new/type" },
  { operation: "configuration.importTemplate", route: "/admin/types" },
  { operation: "entityType.get", route: "/admin/types/[id]" },
  { operation: "entityType.update", route: "/admin/types/[id]" },
  { operation: "entityType.archive", route: "/admin/types/[id]" },
  { operation: "itemTypeGroup.list", route: "/admin/types" },
  { operation: "itemTypeGroup.get", route: "/admin/types" },
  { operation: "itemTypeGroup.create", route: "/admin/types" },
  { operation: "itemTypeGroup.update", route: "/admin/types" },
  { operation: "itemTypeGroup.reorder", route: "/admin/types" },
  { operation: "itemTypeGroup.archive", route: "/admin/types" },
  { operation: "fieldDefinition.list", route: "/admin/types/[id]" },
  { operation: "fieldDefinition.get", route: "/admin/types/[id]" },
  { operation: "fieldDefinition.create", route: "/admin/types/[id]" },
  { operation: "fieldDefinition.update", route: "/admin/types/[id]" },
  { operation: "fieldDefinition.archive", route: "/admin/types/[id]" },
  { operation: "vocabulary.list", route: "/admin/lists" },
  { operation: "vocabulary.create", route: "/admin/lists" },
  { operation: "vocabulary.importTemplate", route: "/admin/lists" },
  { operation: "vocabulary.get", route: "/admin/lists/[id]" },
  { operation: "vocabulary.update", route: "/admin/lists/[id]" },
  { operation: "vocabulary.archive", route: "/admin/lists/[id]" },
  { operation: "vocabulary.addValue", route: "/admin/lists/[id]" },
  { operation: "vocabulary.updateValue", route: "/admin/lists/[id]" },
  { operation: "vocabulary.archiveValue", route: "/admin/lists/[id]" },
  // The floor element library is used on the floor plan and layouts pages; they have their own routes.
  { operation: "floorElementKind.list", route: "/items/[id]/layouts" },
  { operation: "floorElementKind.importTemplate", route: "/items/[id]/layouts" },
  { operation: "floorPlan.get", route: "/items/[id]/floor-plan" },
  { operation: "floorPlan.save", route: "/items/[id]/floor-plan" },
  { operation: "layout.get", route: "/items/[id]/layouts" },
  { operation: "layout.create", route: "/items/[id]/layouts" },
  { operation: "layout.save", route: "/items/[id]/layouts" },
  { operation: "layout.archive", route: "/items/[id]/layouts" },
  { operation: "responsibility.list", route: "/admin/responsibilities" },
  { operation: "responsibility.get", route: "/admin/responsibilities" },
  { operation: "responsibility.create", route: "/admin/responsibilities" },
  { operation: "responsibility.update", route: "/admin/responsibilities" },
  { operation: "responsibility.archive", route: "/admin/responsibilities" },
  { operation: "runSheetDefinition.list", route: "/admin/run-sheets" },
  { operation: "runSheetDefinition.get", route: "/admin/run-sheets" },
  { operation: "runSheetDefinition.create", route: "/admin/run-sheets" },
  { operation: "runSheetDefinition.update", route: "/admin/run-sheets" },
  { operation: "runSheetDefinition.archive", route: "/admin/run-sheets" },
  { operation: "orderStatus.list", route: "/admin/pipeline" },
  { operation: "orderStatus.get", route: "/admin/pipeline" },
  { operation: "orderStatus.create", route: "/admin/pipeline" },
  { operation: "orderStatus.update", route: "/admin/pipeline" },
  { operation: "orderStatus.archive", route: "/admin/pipeline" },
  { operation: "orderStatus.archivePreview", route: "/admin/pipeline" },
  { operation: "orderStatus.reorder", route: "/admin/pipeline" },
  { operation: "orderStatus.setTransitions", route: "/admin/pipeline" },
  { operation: "orderStatus.importTemplate", route: "/admin/pipeline" },
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
