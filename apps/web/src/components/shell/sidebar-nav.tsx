"use client";

import { usePathname } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { canPermission } from "@/lib/can";
import { NAV_GROUPS, type NavAudience, type NavGroupId, type NavItem } from "./nav-items";
import type { ShellAccess } from "./shell-types";
import { activeHref, SidebarLink } from "./sidebar-link";

export type SidebarNavProps = {
  groups: readonly NavGroupId[];
  label: "mainNavigation" | "adminNavigation";
  access: ShellAccess;
  /** Show each group's heading (the main zone); the admin zone has none. */
  headings: boolean;
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

/** One sidebar zone: its groups, filtered by what the member may see (ADR 0036). */
export function SidebarNav({ groups, label, access, headings }: SidebarNavProps) {
  const t = useTranslations("nav");
  const shell = useTranslations("shell");
  const pathname = usePathname();
  const visible = groups
    .map((group) => ({
      group,
      items: NAV_GROUPS[group].filter((item) => isVisible({ item, access })),
    }))
    .filter(({ items }) => items.length > 0);
  if (visible.length === 0) return null;
  const hrefs = visible.flatMap(({ items }) => items.map((item) => item.href));
  const current = activeHref({ pathname, hrefs });
  return (
    <nav aria-label={shell(label)} className="grid gap-4">
      {visible.map(({ group, items }) => (
        <div key={group} className="grid gap-1">
          {headings ? (
            <span className="px-3 text-xs font-medium text-muted-foreground">
              {t(`groups.${group}`)}
            </span>
          ) : null}
          {items.map(({ href, labelKey, icon }) => (
            <SidebarLink
              key={href}
              href={href}
              label={t(labelKey)}
              icon={icon}
              active={href === current}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
