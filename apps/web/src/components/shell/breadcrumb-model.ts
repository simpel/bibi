import type { NavLabelKey } from "./nav-items";
import type { SettingsKey } from "./settings-items";

export type CrumbLabelKey =
  | NavLabelKey
  | SettingsKey
  | "profile"
  | "quotes"
  | "chats"
  | "new"
  | "edit"
  | "detail";

const SEGMENT_KEYS: Record<string, CrumbLabelKey> = {
  chats: "chats",
  pipeline: "pipeline",
  dashboard: "dashboard",
  calendar: "calendar",
  tickets: "tickets",
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
  responsibilities: "responsibilities",
  integrations: "integrations",
  profile: "profile",
  quotes: "quotes",
  members: "members",
  payments: "payments",
  "item-states": "itemStates",
  new: "new",
  edit: "edit",
  update: "edit",
};

/** `/new/<thing>` pages: the path of the thing's list page, which is the parent crumb. */
const NEW_PARENTS: Record<string, string> = {
  item: "items",
  skill: "skills",
  ticket: "tickets",
  type: "settings/types",
  venue: "venues",
  customer: "customers",
  sheet: "settings/sheets",
  responsibility: "settings/responsibilities",
  "price-list": "settings/price-lists",
  "ticket-phase": "settings/pipeline",
  "item-state": "settings/item-states",
};

export type Crumb = { href: string; labelKey: CrumbLabelKey };

export type BuildCrumbsInput = { pathname: string };

/** One crumb per path segment; unknown segments (ids) are a generic "Details". Empty on `/`. */
export function buildCrumbs({ pathname }: BuildCrumbsInput): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const parent = segments[0] === "new" ? NEW_PARENTS[segments[1] ?? ""] : undefined;
  if (parent) {
    return [...buildCrumbs({ pathname: `/${parent}` }), { href: pathname, labelKey: "new" }];
  }
  return segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    labelKey: SEGMENT_KEYS[segment] ?? "detail",
  }));
}
