"use client";

import { usePathname } from "@bibi/i18n/navigation";
import { useTranslations } from "next-intl";
import { canPermission } from "@/lib/can";
import { NavGroup } from "./nav-group";
import { NAV_GROUPS, type NavAudience, type NavGroupId, type NavItem } from "./nav-items";
import type { ShellAccess } from "./shell-types";
import { activeHref } from "./sidebar-link";

export type SidebarNavProps = {
  groups: readonly NavGroupId[];
  access: ShellAccess;
  /** Show each group's heading, which makes it collapsible (Work, Catalog, Administration). */
  headings: boolean;
  /** Groups that start collapsed unless the current page is inside them. */
  closed?: readonly NavGroupId[];
};

const VISIBLE: Record<NavAudience, (access: ShellAccess) => boolean> = {
  everyone: () => true,
  configure: (access) => access.canConfigure,
};

type IsVisibleInput = { item: NavItem; access: ShellAccess };

function isVisible({ item, access }: IsVisibleInput): boolean {
  if (!VISIBLE[item.audience](access)) return false;
  return (
    !item.permission ||
    canPermission({ permissions: access.permissions, permission: item.permission })
  );
}

/** Sidebar groups, filtered by what the member may see (ADR 0036, 0050). */
export function SidebarNav({ groups, access, headings, closed = [] }: SidebarNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const visible = groups
    .map((group) => ({
      group,
      items: NAV_GROUPS[group].filter((item) => isVisible({ item, access })),
    }))
    .filter(({ items }) => items.length > 0);
  const hrefs = visible.flatMap(({ items }) => items.map((item) => item.href));
  const current = activeHref({ pathname, hrefs });
  return visible.map(({ group, items }) => (
    <NavGroup
      key={group}
      items={items}
      current={current}
      defaultOpen={!closed.includes(group)}
      {...(headings ? { heading: t(`groups.${group}`) } : {})}
    />
  ));
}
