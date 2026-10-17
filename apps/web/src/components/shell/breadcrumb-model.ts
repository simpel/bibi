import type { NavLabelKey } from "./nav-items";
import type { SettingsKey } from "./settings-items";

export type CrumbLabelKey = NavLabelKey | SettingsKey | "profile" | "quotes" | "new" | "edit" | "detail";

const SEGMENT_KEYS: Record<string, CrumbLabelKey> = {
  calendar: "calendar",
  bookings: "bookings",
  inquiries: "inquiries",
  "booking-series": "bookingSeries",
  customers: "customers",
  items: "items",
  venues: "venues",
  skills: "skills",
  settings: "settings",
  types: "types",
  lists: "lists",
  setups: "setups",
  sheets: "sheets",
  "price-lists": "priceLists",
  "booking-statuses": "bookingStatuses",
  responsibilities: "responsibilities",
  integrations: "integrations",
  profile: "profile",
  quotes: "quotes",
  members: "members",
  payments: "payments",
  new: "new",
  edit: "edit",
};

export type Crumb = { href: string; labelKey: CrumbLabelKey };

export type BuildCrumbsInput = { pathname: string };

/** One crumb per path segment; unknown segments (ids) are a generic "Details". Empty on `/`. */
export function buildCrumbs({ pathname }: BuildCrumbsInput): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    labelKey: SEGMENT_KEYS[segment] ?? "detail",
  }));
}
