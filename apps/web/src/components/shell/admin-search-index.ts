import { ROUTES } from "@/lib/routes";
import type { AdminKey } from "./admin-items";

/** Every place the administration search can take you to (`adminArea.search.entries.*`). */
export type AdminSearchId =
  | "timeZone"
  | "domainJoin"
  | "members"
  | "invitations"
  | "plan"
  | "seats"
  | "seatRequests"
  | "types"
  | "setups"
  | "lists"
  | "priceLists"
  | "orderStatuses"
  | "flowRules"
  | "statusGrid"
  | "itemStates"
  | "orderTemplates"
  | "runSheets"
  | "responsibilities"
  | "stripe"
  | "deposit"
  | "invoices"
  | "fiscalYear"
  | "accounts"
  | "revenueAccounts"
  | "fortnox"
  | "apiKeys";

export type AdminSearchEntry = {
  id: AdminSearchId;
  /** The sidebar page it belongs to, shown under the result. */
  page: AdminKey;
  /** The tab's route; the entry shows only when the caller may view it. */
  href: string;
  /** The `id` of the `AdminSection` on that page, when the entry is a block on it. */
  anchor?: string;
};

/**
 * The index behind the administration search: each page, tab and settings block. A new
 * `AdminSection` adds its entry here (with an `anchor`) and its texts in `adminArea.search`.
 */
export const ADMIN_SEARCH_INDEX: readonly AdminSearchEntry[] = [
  { id: "timeZone", page: "general", href: ROUTES.adminGeneral, anchor: "time-zone" },
  { id: "domainJoin", page: "general", href: ROUTES.adminGeneral, anchor: "domain-join" },
  { id: "members", page: "members", href: ROUTES.adminMembers },
  { id: "invitations", page: "members", href: ROUTES.adminMembers, anchor: "invitations" },
  { id: "plan", page: "planBilling", href: ROUTES.adminBilling, anchor: "plan" },
  { id: "seats", page: "planBilling", href: ROUTES.adminBilling, anchor: "seats" },
  { id: "seatRequests", page: "planBilling", href: ROUTES.adminBilling, anchor: "seat-requests" },
  { id: "types", page: "types", href: ROUTES.adminTypes },
  { id: "setups", page: "types", href: ROUTES.adminSetups },
  { id: "lists", page: "lists", href: ROUTES.adminLists },
  { id: "priceLists", page: "priceLists", href: ROUTES.adminPriceLists },
  { id: "orderStatuses", page: "orderFlow", href: ROUTES.adminPipeline },
  { id: "flowRules", page: "orderFlow", href: ROUTES.adminPipeline, anchor: "flow-rules" },
  { id: "statusGrid", page: "orderFlow", href: ROUTES.adminPipeline, anchor: "status-grid" },
  { id: "itemStates", page: "orderFlow", href: ROUTES.adminItemStates },
  { id: "orderTemplates", page: "orderTemplates", href: ROUTES.adminOrderTemplates },
  { id: "runSheets", page: "runSheets", href: ROUTES.adminRunSheets },
  { id: "responsibilities", page: "runSheets", href: ROUTES.adminResponsibilities },
  { id: "stripe", page: "payments", href: ROUTES.adminPayments, anchor: "stripe" },
  { id: "deposit", page: "payments", href: ROUTES.adminPayments, anchor: "deposit" },
  { id: "invoices", page: "payments", href: ROUTES.adminPayments, anchor: "invoices" },
  { id: "fiscalYear", page: "accounting", href: ROUTES.adminAccounting, anchor: "fiscal-year" },
  { id: "accounts", page: "accounting", href: ROUTES.adminAccounting, anchor: "accounts" },
  {
    id: "revenueAccounts",
    page: "accounting",
    href: ROUTES.adminAccounting,
    anchor: "revenue-accounts",
  },
  { id: "fortnox", page: "integrations", href: ROUTES.adminIntegrations },
  { id: "apiKeys", page: "integrations", href: ROUTES.adminApiKeys },
];

/** Lower case without diacritics, so "tidszon" finds "Tidszon" and "a" finds "å". */
export function foldText({ text }: { text: string }): string {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}

export type SearchableEntry = AdminSearchEntry & {
  label: string;
  pageLabel: string;
  keywords: string;
};

export type SearchAdminInput = {
  entries: readonly SearchableEntry[];
  /** The tab routes the caller may view. */
  visibleHrefs: ReadonlySet<string>;
  query: string;
};

/**
 * The entries every word of the query appears in (label, page or keywords), the ones whose
 * label starts with the query first.
 */
export function searchAdmin({ entries, visibleHrefs, query }: SearchAdminInput): SearchableEntry[] {
  const words = foldText({ text: query }).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const first = words.join(" ");
  const hits = entries.filter((entry) => {
    if (!visibleHrefs.has(entry.href)) return false;
    const haystack = foldText({ text: `${entry.label} ${entry.pageLabel} ${entry.keywords}` });
    return words.every((word) => haystack.includes(word));
  });
  const starts = ({ entry }: { entry: SearchableEntry }) =>
    foldText({ text: entry.label }).startsWith(first) ? 0 : 1;
  return [...hits].sort((a, b) => starts({ entry: a }) - starts({ entry: b }));
}

/** The link of a result: the page, and the section on it when there is one. */
export function adminSearchHref({ entry }: { entry: AdminSearchEntry }): string {
  return entry.anchor ? `${entry.href}#${entry.anchor}` : entry.href;
}
