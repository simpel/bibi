export const ROUTES = {
  home: "/",
  /** The assistant, full width (ADR 0110); `/` is My work. */
  assistant: "/assistant",
  /** My work for a range of days: `/my-work/{from}/{to}`; `/` is today. */
  myWork: "/my-work",
  /** Opens the active organization (or welcome, or login); `/` is the public front page (ADR 0073). */
  app: "/select-organization",
  chats: "/chats",
  pipeline: "/pipeline",
  dashboard: "/data",
  login: "/login",
  signUp: "/sign-up",
  venues: "/venues",
  profile: "/profile",
  /** Public help: common questions and staff guides. */
  support: "/support",
  skills: "/skills",
  skillNew: "/new/skill",
  items: "/items",
  /** Packages (order templates), daily sales work under Catalog (ADR 0112). */
  packages: "/packages",
  create: "/new",
  itemNew: "/new/item",
  typeNew: "/new/type",
  /** Create an item type from the item create page; saving goes back to it with the new type. */
  typeNewForItem: "/new/type?for=item",
  venueNew: "/new/venue",
  customerNew: "/new/customer",
  runSheetNew: "/new/run-sheet",
  responsibilityNew: "/new/responsibility",
  priceListNew: "/new/price-list",
  orderStatusNew: "/new/order-status",
  itemStateNew: "/new/item-state",
  orderTemplateNew: "/new/order-template",
  orderNew: "/new/order",
  /** Create a task (ADR 0117); `?customer=`, `?order=` or a calendar slot prefill it. */
  taskNew: "/new/task",
  depositNew: "/new/deposit",
  customers: "/customers",
  notifications: "/notifications",
  orders: "/orders",
  tasks: "/tasks",
  runSheets: "/run-sheets",
  calendar: "/calendar",
  financials: "/data/financials", // one of the dashboards (ADR 0086)
  workload: "/data/workload",
  forecast: "/data/forecast",
  quotes: "/quotes",
  /** Table reservations: the day view and one reservation (ADR 0119). */
  reservations: "/reservations",
  /** The welcome flow (ADR 0061); under an organization it is `/:org/welcome`. */
  welcome: "/welcome",
  /** The administration area (ADR 0036): its own sidebar, opens on a start page listing every page the caller may see. */
  admin: "/admin",
  adminGeneral: "/admin/general",
  adminArchive: "/admin/archive",
  adminMembers: "/admin/members",
  adminBilling: "/admin/billing",
  adminTypes: "/admin/types",
  adminLists: "/admin/lists",
  adminPriceLists: "/admin/price-lists",
  adminPipeline: "/admin/pipeline",
  adminItemStates: "/admin/item-states",
  adminRunSheets: "/admin/run-sheets",
  adminTableBooking: "/admin/table-booking",
  adminResponsibilities: "/admin/responsibilities",
  adminPayments: "/admin/payments",
  adminAccounting: "/admin/accounting",
  adminIntegrations: "/admin/integrations",
  adminApiKeys: "/admin/api-keys",
  // Lists that are sections of another page now: return here, not through the old list address,
  // whose redirect would add its anchor a second time.
  adminItemStatesSection: "/admin/pipeline#item-states",
  adminResponsibilitiesSection: "/admin/run-sheets#responsibilities",
  adminApiKeysSection: "/admin/integrations#api-keys",
  mothership: "/mothership",
  mothershipOrganizations: "/mothership/organizations",
  mothershipBilling: "/mothership/billing",
  mothershipLogs: "/mothership/logs",
  mothershipAiModels: "/mothership/ai-models",
  adminLogs: "/mothership/logs",
  adminAiModels: "/mothership/ai-models",
} as const;

export type ItemRouteInput = { id: string };

export function itemRoute({ id }: ItemRouteInput): string {
  return `${ROUTES.items}/${encodeURIComponent(id)}`;
}

export type ListItemRouteInput = { list: string; id: string };

/** Detail path of a record under a list page, e.g. `/admin/run-sheets/<id>`. */
export function listItemRoute({ list, id }: ListItemRouteInput): string {
  return `${list}/${encodeURIComponent(id)}`;
}

/** The input of a record's detail route. */
export type IdRouteInput = { id: string };

export type UpdateRouteInput = { detail: string };

/** Update pages live under the detail page: `/<things>/<id>/update`. */
export function updateRoute({ detail }: UpdateRouteInput): string {
  return `${detail}/update`;
}

export function venueRoute({ id }: IdRouteInput): string {
  return `${ROUTES.venues}/${encodeURIComponent(id)}`;
}

export type VenueItemsRouteInput = { id: string; typeId?: string | undefined };

/** A venue's items, all or of one item type: `/venues/<id>/items[/<typeId>]`. */
export function venueItemsRoute({ id, typeId }: VenueItemsRouteInput): string {
  const all = `${venueRoute({ id })}/items`;
  return typeId ? `${all}/${encodeURIComponent(typeId)}` : all;
}

export function customerRoute({ id }: IdRouteInput): string {
  return `${ROUTES.customers}/${encodeURIComponent(id)}`;
}

export function orderRoute({ id }: IdRouteInput): string {
  return `${ROUTES.orders}/${encodeURIComponent(id)}`;
}

/** `/tasks/<id>`: a task's detail page (ADR 0117). */
export function taskRoute({ id }: IdRouteInput): string {
  return `${ROUTES.tasks}/${encodeURIComponent(id)}`;
}

export type TaskNewRouteInput = {
  customerId?: string | undefined;
  orderId?: string | undefined;
  /** A calendar slot: instants as ISO strings and the row's item. */
  from?: string | undefined;
  to?: string | undefined;
  itemId?: string | undefined;
};

/** `/new/task?customer=&order=&from=&to=&item=`: the create page, prefilled. */
export function taskNewRoute({ customerId, orderId, from, to, itemId }: TaskNewRouteInput): string {
  const query = new URLSearchParams();
  const pairs = [
    ["customer", customerId],
    ["order", orderId],
    ["from", from],
    ["to", to],
    ["item", itemId],
  ] as const;
  for (const [key, value] of pairs) if (value) query.set(key, value);
  const search = query.toString();
  return search ? `${ROUTES.taskNew}?${search}` : ROUTES.taskNew;
}

export type DepositNewRouteInput = { orderId: string };

/** `/new/deposit?order=<id>`: a deposit request on that order. */
export function depositNewRoute({ orderId }: DepositNewRouteInput): string {
  return `${ROUTES.depositNew}?order=${encodeURIComponent(orderId)}`;
}

export function quoteRoute({ id }: IdRouteInput): string {
  return `${ROUTES.quotes}/${encodeURIComponent(id)}`;
}

export function skillRoute({ id }: IdRouteInput): string {
  return `${ROUTES.skills}/${encodeURIComponent(id)}`;
}

export type WithNextInput = { path: string; next: string };

/** `/login?next=/venues/x`: carries the post-sign-in target between auth pages. */
export function withNext({ path, next }: WithNextInput): string {
  return `${path}?next=${encodeURIComponent(next)}`;
}

export type SubjectRouteInput = { id: string };

/** `/admin/members/<id>`: a member's detail page. */
export function memberRoute({ id }: SubjectRouteInput): string {
  return `${ROUTES.adminMembers}/${encodeURIComponent(id)}`;
}

/** `/admin/api-keys/<id>`: an API key's crumb; the page leads to its permissions. */
export function apiKeyRoute({ id }: SubjectRouteInput): string {
  return `${ROUTES.adminApiKeys}/${encodeURIComponent(id)}`;
}

/** `/admin/members/<id>/permissions`: a member's permission grid (ADR 0050). */
export function memberPermissionsRoute({ id }: SubjectRouteInput): string {
  return `${memberRoute({ id })}/permissions`;
}

/** `/admin/api-keys/<id>/permissions`: an API key's permission grid (ADR 0050). */
export function apiKeyPermissionsRoute({ id }: SubjectRouteInput): string {
  return `${apiKeyRoute({ id })}/permissions`;
}

/** `/admin/api-keys/<id>/update`: rename a key and change its preset. */
export function apiKeyUpdateRoute({ id }: SubjectRouteInput): string {
  return updateRoute({ detail: apiKeyRoute({ id }) });
}
