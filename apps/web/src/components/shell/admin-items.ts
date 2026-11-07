import type { Permission, PermissionSet } from "@bibi/core";
import {
  Building2Icon,
  ClipboardListIcon,
  CopyPlusIcon,
  CreditCardIcon,
  GitBranchIcon,
  ListIcon,
  type LucideIcon,
  PlugIcon,
  ReceiptIcon,
  ReceiptTextIcon,
  ShapesIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react";
import { canPermission } from "@/lib/can";
import { ROUTES } from "@/lib/routes";

/** Labels (`nav.*`) of the administration pages and their tabs. */
export type AdminKey =
  | "general"
  | "members"
  | "planBilling"
  | "types"
  | "setups"
  | "lists"
  | "priceLists"
  | "orderFlow"
  | "orderStatuses"
  | "itemStates"
  | "orderTemplates"
  | "runSheets"
  | "responsibilities"
  | "payments"
  | "accounting"
  | "integrations"
  | "fortnox"
  | "apiKeys";

export type AdminGroupId = "organization" | "catalog" | "orders" | "money";

/** One tab of a page; a page with tabs opens on the first one the caller may see. */
export type AdminTab = { href: string; key: AdminKey; permission: Permission };

export type AdminPage = {
  key: AdminKey;
  icon: LucideIcon;
  /** Tabs in order; a page without tabs has exactly one, its own route. */
  tabs: readonly AdminTab[];
};

export type AdminGroup = { id: AdminGroupId; pages: readonly AdminPage[] };

const single = ({ href, key, permission }: AdminTab): readonly AdminTab[] => [
  { href, key, permission },
];

/** The administration area's sidebar (ADR 0036): four groups, a page per job, tabs for close kin. */
export const ADMIN_GROUPS: readonly AdminGroup[] = [
  {
    id: "organization",
    pages: [
      {
        key: "general",
        icon: Building2Icon,
        tabs: single({
          href: ROUTES.adminGeneral,
          key: "general",
          permission: "configuration:read",
        }),
      },
      {
        key: "members",
        icon: UsersIcon,
        tabs: single({ href: ROUTES.adminMembers, key: "members", permission: "member:read" }),
      },
      {
        key: "planBilling",
        icon: ReceiptIcon,
        tabs: single({ href: ROUTES.adminBilling, key: "planBilling", permission: "billing:read" }),
      },
    ],
  },
  {
    id: "catalog",
    pages: [
      {
        key: "types",
        icon: ShapesIcon,
        tabs: [
          { href: ROUTES.adminTypes, key: "types", permission: "configuration:read" },
          { href: ROUTES.adminSetups, key: "setups", permission: "configuration:read" },
        ],
      },
      {
        key: "lists",
        icon: ListIcon,
        tabs: single({ href: ROUTES.adminLists, key: "lists", permission: "configuration:read" }),
      },
      {
        key: "priceLists",
        icon: TagIcon,
        tabs: single({
          href: ROUTES.adminPriceLists,
          key: "priceLists",
          permission: "priceList:read",
        }),
      },
    ],
  },
  {
    id: "orders",
    pages: [
      {
        key: "orderFlow",
        icon: GitBranchIcon,
        tabs: [
          { href: ROUTES.adminPipeline, key: "orderStatuses", permission: "pipeline:read" },
          { href: ROUTES.adminItemStates, key: "itemStates", permission: "pipeline:read" },
        ],
      },
      {
        key: "orderTemplates",
        icon: CopyPlusIcon,
        tabs: single({
          href: ROUTES.adminOrderTemplates,
          key: "orderTemplates",
          permission: "template:read",
        }),
      },
      {
        key: "runSheets",
        icon: ClipboardListIcon,
        tabs: [
          { href: ROUTES.adminRunSheets, key: "runSheets", permission: "template:read" },
          {
            href: ROUTES.adminResponsibilities,
            key: "responsibilities",
            permission: "responsibility:read",
          },
        ],
      },
    ],
  },
  {
    id: "money",
    pages: [
      {
        key: "payments",
        icon: CreditCardIcon,
        tabs: single({
          href: ROUTES.adminPayments,
          key: "payments",
          permission: "paymentAccount:read",
        }),
      },
      {
        key: "accounting",
        icon: ReceiptTextIcon,
        tabs: single({
          href: ROUTES.adminAccounting,
          key: "accounting",
          permission: "finance:read",
        }),
      },
      {
        key: "integrations",
        icon: PlugIcon,
        tabs: [
          { href: ROUTES.adminIntegrations, key: "fortnox", permission: "integration:read" },
          { href: ROUTES.adminApiKeys, key: "apiKeys", permission: "apiKey:read" },
        ],
      },
    ],
  },
];

export type VisibleAdminInput = { permissions: PermissionSet };

/** The groups, pages and tabs the caller may view (ADR 0050); empty pages and groups drop out. */
export function visibleAdminGroups({ permissions }: VisibleAdminInput): AdminGroup[] {
  return ADMIN_GROUPS.map((group) => ({
    ...group,
    pages: group.pages
      .map((page) => ({
        ...page,
        tabs: page.tabs.filter(({ permission }) => canPermission({ permissions, permission })),
      }))
      .filter((page) => page.tabs.length > 0),
  })).filter((group) => group.pages.length > 0);
}

/** Where `/admin` opens: the first page the caller may view, or null when there is none. */
export function firstAdminHref({ permissions }: VisibleAdminInput): string | null {
  return visibleAdminGroups({ permissions })[0]?.pages[0]?.tabs[0]?.href ?? null;
}

/** Whether the caller may open the administration area at all (the sidebar entry and `/admin`). */
export function canOpenAdmin({ permissions }: VisibleAdminInput): boolean {
  return firstAdminHref({ permissions }) !== null;
}

export type AdminPageOfInput = VisibleAdminInput & { key: AdminKey };

/** A page's visible tabs, for its tab bar (more than one) and its own permission check. */
export function adminTabs({ permissions, key }: AdminPageOfInput): AdminTab[] {
  const page = visibleAdminGroups({ permissions })
    .flatMap((group) => group.pages)
    .find((candidate) => candidate.key === key);
  return page ? [...page.tabs] : [];
}
