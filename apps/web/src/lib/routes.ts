export const ROUTES = {
  home: "/",
  chats: "/chats",
  pipeline: "/pipeline",
  dashboard: "/dashboard",
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
  sheetNew: "/new/sheet",
  responsibilityNew: "/new/responsibility",
  priceListNew: "/new/price-list",
  ticketPhaseNew: "/new/ticket-phase",
  itemStateNew: "/new/item-state",
  ticketTemplateNew: "/new/ticket-template",
  ticketNew: "/new/ticket",
  depositNew: "/new/deposit",
  customers: "/customers",
  tickets: "/tickets",
  calendar: "/calendar",
  quotes: "/quotes",
  settings: "/settings",
  settingsTypes: "/settings/types",
  settingsLists: "/settings/lists",
  settingsSetups: "/settings/setups",
  settingsResponsibilities: "/settings/responsibilities",
  settingsSheets: "/settings/sheets",
  settingsPriceLists: "/settings/price-lists",
  settingsPipeline: "/settings/pipeline",
  /** The welcome flow (ADR 0061); under an organization it is `/:org/welcome`. */
  welcome: "/welcome",
  settingsItemStates: "/settings/item-states",
  settingsTicketTemplates: "/settings/ticket-templates",
  settingsMembers: "/admin/members",
  settingsPayments: "/settings/payments",
  settingsIntegrations: "/admin/api-keys",
  settingsApiKeys: "/admin/api-keys",
  admin: "/admin",
  adminMembers: "/admin/members",
  adminApiKeys: "/admin/api-keys",
  mothership: "/mothership",
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

/** Detail path of a record under a list page, e.g. `/settings/sheets/<id>`. */
export function listItemRoute({ list, id }: ListItemRouteInput): string {
  return `${list}/${encodeURIComponent(id)}`;
}

export type UpdateRouteInput = { detail: string };

/** Update pages live under the detail page: `/<things>/<id>/update`. */
export function updateRoute({ detail }: UpdateRouteInput): string {
  return `${detail}/update`;
}

export type VenueRouteInput = { id: string };

export function venueRoute({ id }: VenueRouteInput): string {
  return `${ROUTES.venues}/${encodeURIComponent(id)}`;
}

export type CustomerRouteInput = { id: string };

export function customerRoute({ id }: CustomerRouteInput): string {
  return `${ROUTES.customers}/${encodeURIComponent(id)}`;
}

export type TicketRouteInput = { id: string };

export function ticketRoute({ id }: TicketRouteInput): string {
  return `${ROUTES.tickets}/${encodeURIComponent(id)}`;
}

export type DepositNewRouteInput = { ticketId: string };

/** `/new/deposit?ticket=<id>`: a deposit request on that ticket. */
export function depositNewRoute({ ticketId }: DepositNewRouteInput): string {
  return `${ROUTES.depositNew}?ticket=${encodeURIComponent(ticketId)}`;
}

export type QuoteRouteInput = { id: string };

export function quoteRoute({ id }: QuoteRouteInput): string {
  return `${ROUTES.quotes}/${encodeURIComponent(id)}`;
}

export type SkillRouteInput = { id: string };

export function skillRoute({ id }: SkillRouteInput): string {
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
