import type { AdminKey } from "./admin-items";
import type { NavLabelKey } from "./nav-items";

export type CrumbLabelKey =
  | NavLabelKey
  | AdminKey
  | "skills"
  | "layouts"
  | "floorPlan"
  | "responsibilities"
  | "itemStates"
  | "orderStatuses"
  | "billing"
  | "profile"
  | "quotes"
  | "chats"
  | "new"
  | "apiKeys"
  | "permissions"
  | "edit"
  | "detail"
  | "notifications"
  | "organizations"
  | "logs"
  | "aiModels"
  | "platformAdmin"
  | "support"
  | "developers";

const SEGMENT_KEYS: Record<string, CrumbLabelKey> = {
  chats: "chats",
  pipeline: "pipeline",
  dashboard: "dashboard",
  data: "dashboard",
  calendar: "calendar",
  forecast: "forecast",
  financials: "financials",
  workload: "workload",
  orders: "orders",
  inbox: "inbox",
  customers: "customers",
  items: "items",
  venues: "venues",
  skills: "skills",
  admin: "admin",
  general: "general",
  types: "types",
  lists: "lists",
  layouts: "layouts",
  "floor-plan": "floorPlan",
  "run-sheets": "runSheets",
  "price-lists": "priceLists",
  responsibilities: "responsibilities",
  integrations: "integrations",
  profile: "profile",
  quotes: "quotes",
  members: "members",
  "api-keys": "apiKeys",
  permissions: "permissions",
  payments: "payments",
  billing: "billing",
  accounting: "accounting",
  "item-states": "itemStates",
  "order-templates": "orderTemplates",
  notifications: "notifications",
  mothership: "platformAdmin",
  organizations: "organizations",
  logs: "logs",
  "ai-models": "aiModels",
  support: "support",
  developers: "developers",
  new: "new",
  edit: "edit",
  update: "edit",
};

/** Segments named after their administration page or tab rather than the app page of that name. */
const ADMIN_SEGMENT_KEYS: Record<string, CrumbLabelKey> = {
  pipeline: "orderFlow",
  billing: "planBilling",
};

type SegmentKeyInput = { segments: readonly string[]; segment: string };

/** The label of one path segment; inside `/admin` the area's own names win. */
function segmentKey({ segments, segment }: SegmentKeyInput): CrumbLabelKey {
  const admin = segments[0] === "admin" ? ADMIN_SEGMENT_KEYS[segment] : undefined;
  return admin ?? SEGMENT_KEYS[segment] ?? "detail";
}

/** Administration collections that have an update page but no detail page of their own. */
const NO_DETAIL_SETTINGS = new Set([
  "pipeline",
  "price-lists",
  "run-sheets",
  "order-templates",
  "responsibilities",
  "item-states",
]);

/** `/new/<thing>` pages: the path of the thing's list page, which is the parent crumb. */
const NEW_PARENTS: Record<string, string> = {
  item: "items",
  skill: "skills",
  order: "orders",
  deposit: "orders",
  type: "admin/types",
  venue: "venues",
  customer: "customers",
  "run-sheet": "admin/run-sheets",
  responsibility: "admin/responsibilities",
  "price-list": "admin/price-lists",
  "order-status": "admin/pipeline",
  "item-state": "admin/item-states",
  "order-template": "admin/order-templates",
};

/** Pages whose later segments are a period, not a page (`/calendar/{from}/{to}`, ADR 0064). */
const PERIOD_PAGES = new Set(["calendar"]);

/** Segments whose next segment is a tab of the same page (`/items/{id}/layouts/{tab}`, ADR 0099). */
const TAB_SEGMENTS = new Set(["layouts"]);

export type Crumb = { href: string; labelKey: CrumbLabelKey };

export type BuildCrumbsInput = { pathname: string };

/** One crumb per path segment; unknown segments (ids) are a generic "Details". Empty on `/`. */
export function buildCrumbs({ pathname }: BuildCrumbsInput): Crumb[] {
  const all = pathname.split("/").filter(Boolean);
  if (all[0] === "data" || all[0] === "dashboard") {
    const rootCrumb: Crumb = { href: "/data", labelKey: "dashboard" };
    const tab = all[1];
    if (tab && (tab === "forecast" || tab === "financials" || tab === "workload")) {
      return [rootCrumb, { href: `/data/${tab}`, labelKey: SEGMENT_KEYS[tab] ?? "detail" }];
    }
    return [rootCrumb];
  }
  const tabAt = all.findIndex((segment) => TAB_SEGMENTS.has(segment));
  const untabbed = tabAt >= 0 ? all.slice(0, tabAt + 1) : all;
  const segments = PERIOD_PAGES.has(untabbed[0] ?? "") ? untabbed.slice(0, 1) : untabbed;
  if (segments[0] === "quotes") {
    return [
      { href: "/orders", labelKey: "orders" },
      ...(segments.length > 1 ? [{ href: pathname, labelKey: "quotes" as const }] : []),
    ];
  }
  if (segments[0] === "support" || segments[0] === "developers") {
    const root: Crumb = { href: `/${segments[0]}`, labelKey: segments[0] };
    return segments.length <= 1 ? [root] : [root, { href: pathname, labelKey: "detail" }];
  }
  if (
    segments[0] === "admin" &&
    NO_DETAIL_SETTINGS.has(segments[1] ?? "") &&
    segments[3] === "update"
  ) {
    const section = segments[1] ?? "";
    return [
      { href: "/admin", labelKey: "admin" },
      { href: `/admin/${section}`, labelKey: segmentKey({ segments, segment: section }) },
      { href: pathname, labelKey: "edit" },
    ];
  }
  const parent = segments[0] === "new" ? NEW_PARENTS[segments[1] ?? ""] : undefined;
  if (parent) {
    return [...buildCrumbs({ pathname: `/${parent}` }), { href: pathname, labelKey: "new" }];
  }
  return segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    labelKey: segmentKey({ segments, segment }),
  }));
}
