export const ROUTES = {
  home: "/",
  chats: "/chats",
  pipeline: "/pipeline",
  dashboard: "/dashboard",
  login: "/login",
  signUp: "/sign-up",
  selectOrganization: "/select-organization",
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
  ticketNew: "/new/ticket",
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
  settingsItemStates: "/settings/item-states",
  settingsMembers: "/settings/members",
  settingsPayments: "/settings/payments",
  settingsIntegrations: "/settings/integrations",
  admin: "/admin",
  adminLogs: "/admin/logs",
  adminAiModels: "/admin/ai-models",
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
