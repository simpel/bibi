export const ROUTES = {
  home: "/",
  /** Opens the active organization (or welcome, or login); `/` is the public front page (ADR 0073). */
  app: "/select-organization",
  chats: "/chats",
  pipeline: "/pipeline",
  dashboard: "/data",
  login: "/login",
  signUp: "/sign-up",
  venues: "/venues",
  profile: "/profile",
  skills: "/skills",
  skillNew: "/new/skill",
  items: "/items",
  create: "/new",
  itemNew: "/new/item",
  typeNew: "/new/type",
  venueNew: "/new/venue",
  customerNew: "/new/customer",
  runSheetNew: "/new/run-sheet",
  responsibilityNew: "/new/responsibility",
  priceListNew: "/new/price-list",
  orderStatusNew: "/new/order-status",
  itemStateNew: "/new/item-state",
  orderTemplateNew: "/new/order-template",
  orderNew: "/new/order",
  depositNew: "/new/deposit",
  customers: "/customers",
  notifications: "/notifications",
  orders: "/orders",
  runSheets: "/run-sheets",
  calendar: "/calendar",
  financials: "/data/financials", // one of the dashboards (ADR 0086)
  workload: "/data/workload",
  forecast: "/data/forecast",
  quotes: "/quotes",
  /** The welcome flow (ADR 0061); under an organization it is `/:org/welcome`. */
  welcome: "/welcome",
  /** The administration area (ADR 0036): its own sidebar, opens on the first page the caller may see. */
  admin: "/admin",
  adminGeneral: "/admin/general",
  adminMembers: "/admin/members",
  adminBilling: "/admin/billing",
  adminTypes: "/admin/types",
  adminSetups: "/admin/setups",
  adminLists: "/admin/lists",
  adminPriceLists: "/admin/price-lists",
  adminPipeline: "/admin/pipeline",
  adminItemStates: "/admin/item-states",
  adminOrderTemplates: "/admin/order-templates",
  adminRunSheets: "/admin/run-sheets",
  adminResponsibilities: "/admin/responsibilities",
  adminPayments: "/admin/payments",
  adminAccounting: "/admin/accounting",
  adminIntegrations: "/admin/integrations",
  adminApiKeys: "/admin/api-keys",
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

export function customerRoute({ id }: IdRouteInput): string {
  return `${ROUTES.customers}/${encodeURIComponent(id)}`;
}

export function orderRoute({ id }: IdRouteInput): string {
  return `${ROUTES.orders}/${encodeURIComponent(id)}`;
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
