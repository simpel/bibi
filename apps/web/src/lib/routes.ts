export const ROUTES = {
  home: "/",
  login: "/login",
  signUp: "/sign-up",
  selectOrganization: "/select-organization",
  venues: "/venues",
  skills: "/skills",
  skillNew: "/skills/new",
  items: "/items",
  customers: "/customers",
  bookings: "/bookings",
  calendar: "/calendar",
  bookingSeries: "/booking-series",
  inquiries: "/inquiries",
  settings: "/settings",
  settingsTypes: "/settings/types",
  settingsLists: "/settings/lists",
  settingsSetups: "/settings/setups",
  settingsSheets: "/settings/sheets",
  settingsPriceLists: "/settings/price-lists",
  settingsBookingStatuses: "/settings/booking-statuses",
  settingsRoles: "/settings/roles",
  settingsMembers: "/settings/members",
  settingsPayments: "/settings/payments",
  admin: "/admin",
  adminLogs: "/admin/logs",
  adminAiModels: "/admin/ai-models",
} as const;

export type VenueRouteInput = { id: string };

export function venueRoute({ id }: VenueRouteInput): string {
  return `${ROUTES.venues}/${encodeURIComponent(id)}`;
}

export type CustomerRouteInput = { id: string };

export function customerRoute({ id }: CustomerRouteInput): string {
  return `${ROUTES.customers}/${encodeURIComponent(id)}`;
}

export type BookingRouteInput = { id: string };

export function bookingRoute({ id }: BookingRouteInput): string {
  return `${ROUTES.bookings}/${encodeURIComponent(id)}`;
}

export type BookingSeriesRouteInput = { id: string };

export function bookingSeriesRoute({ id }: BookingSeriesRouteInput): string {
  return `${ROUTES.bookingSeries}/${encodeURIComponent(id)}`;
}

export type InquiryRouteInput = { id: string };

export function inquiryRoute({ id }: InquiryRouteInput): string {
  return `${ROUTES.inquiries}/${encodeURIComponent(id)}`;
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
