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
import { ADMIN_SECTIONS, type AdminSectionId } from "./admin-sections";

/** Labels (`nav.*`) of the administration pages. */
export type AdminKey =
  | "general"
  | "members"
  | "planBilling"
  | "types"
  | "lists"
  | "priceLists"
  | "orderFlow"
  | "orderTemplates"
  | "runSheets"
  | "payments"
  | "accounting"
  | "integrations";

export type AdminGroupId = "organization" | "catalog" | "orders" | "money";

/** One section of a page: its anchor and the view permission it needs (ADR 0050). */
export type AdminSection = { id: AdminSectionId; anchor: string; permission: Permission };

export type AdminPage = {
  key: AdminKey;
  icon: LucideIcon;
  href: string;
  /** In page order; with more than one visible, they are the page's sub-links in the sidebar. */
  sections: readonly AdminSection[];
};

export type AdminGroup = { id: AdminGroupId; pages: readonly AdminPage[] };

type PageInput = { key: AdminKey; icon: LucideIcon; href: string; ids: readonly AdminSectionId[] };

const page = ({ key, icon, href, ids }: PageInput): AdminPage => ({
  key,
  icon,
  href,
  sections: ids.map((id) => ({ id, ...ADMIN_SECTIONS[id] })),
});

/**
 * The administration area's sidebar (ADR 0036): four groups, one page per job, every block on a
 * page a section with its own anchor. The search index is built from the same sections.
 */
export const ADMIN_GROUPS: readonly AdminGroup[] = [
  {
    id: "organization",
    pages: [
      page({
        key: "general",
        icon: Building2Icon,
        href: ROUTES.adminGeneral,
        ids: ["timeZone", "domainJoin"],
      }),
      page({
        key: "members",
        icon: UsersIcon,
        href: ROUTES.adminMembers,
        ids: ["members", "invitations"],
      }),
      page({
        key: "planBilling",
        icon: ReceiptIcon,
        href: ROUTES.adminBilling,
        ids: ["plan", "seats", "seatRequests"],
      }),
    ],
  },
  {
    id: "catalog",
    pages: [
      page({
        key: "types",
        icon: ShapesIcon,
        href: ROUTES.adminTypes,
        ids: ["types", "groups"],
      }),
      page({ key: "lists", icon: ListIcon, href: ROUTES.adminLists, ids: ["lists"] }),
      page({
        key: "priceLists",
        icon: TagIcon,
        href: ROUTES.adminPriceLists,
        ids: ["priceLists"],
      }),
    ],
  },
  {
    id: "orders",
    pages: [
      page({
        key: "orderFlow",
        icon: GitBranchIcon,
        href: ROUTES.adminPipeline,
        ids: ["orderStatuses", "flowRules", "statusGrid", "itemStates"],
      }),
      page({
        key: "orderTemplates",
        icon: CopyPlusIcon,
        href: ROUTES.adminOrderTemplates,
        ids: ["orderTemplates"],
      }),
      page({
        key: "runSheets",
        icon: ClipboardListIcon,
        href: ROUTES.adminRunSheets,
        ids: ["runSheets", "responsibilities"],
      }),
    ],
  },
  {
    id: "money",
    pages: [
      page({
        key: "payments",
        icon: CreditCardIcon,
        href: ROUTES.adminPayments,
        ids: ["paymentMethods", "deposit"],
      }),
      page({
        key: "accounting",
        icon: ReceiptTextIcon,
        href: ROUTES.adminAccounting,
        ids: ["accounts", "revenueAccounts"],
      }),
      page({
        key: "integrations",
        icon: PlugIcon,
        href: ROUTES.adminIntegrations,
        ids: ["providers", "apiKeys"],
      }),
    ],
  },
];

export type VisibleAdminInput = { permissions: PermissionSet };

/** The groups, pages and sections the caller may view; empty pages and groups drop out. */
export function visibleAdminGroups({ permissions }: VisibleAdminInput): AdminGroup[] {
  return ADMIN_GROUPS.map((group) => ({
    ...group,
    pages: group.pages
      .map((one) => ({
        ...one,
        sections: one.sections.filter(({ permission }) =>
          canPermission({ permissions, permission }),
        ),
      }))
      .filter((one) => one.sections.length > 0),
  })).filter((group) => group.pages.length > 0);
}

/** The first page the caller may view, or null when there is none. */
export function firstAdminHref({ permissions }: VisibleAdminInput): string | null {
  return visibleAdminGroups({ permissions })[0]?.pages[0]?.href ?? null;
}

/** Whether the caller may open the administration area at all (the sidebar entry and `/admin`). */
export function canOpenAdmin({ permissions }: VisibleAdminInput): boolean {
  return firstAdminHref({ permissions }) !== null;
}

export type VisibleSectionsInput = VisibleAdminInput & { key: AdminKey };

/** The sections of one page the caller may view, for the page to render. */
export function visibleSections({ permissions, key }: VisibleSectionsInput): Set<AdminSectionId> {
  const found = visibleAdminGroups({ permissions })
    .flatMap((group) => group.pages)
    .find((one) => one.key === key);
  return new Set(found?.sections.map((section) => section.id) ?? []);
}

export type AdminSectionLinkInput = { id: AdminSectionId };

/** The page and anchor of a section (`/admin/general#time-zone`), or null for an unknown id. */
export function adminSectionLink({ id }: AdminSectionLinkInput): string | null {
  for (const group of ADMIN_GROUPS) {
    for (const one of group.pages) {
      const section = one.sections.find((candidate) => candidate.id === id);
      if (section) return `${one.href}#${section.anchor}`;
    }
  }
  return null;
}
