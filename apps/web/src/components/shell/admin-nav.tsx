"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@bibi/ui";
import { ArrowLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { visibleAdminGroups } from "./admin-items";
import type { ShellAccess } from "./shell-types";
import { activeHref } from "./sidebar-link";

export type AdminNavProps = { access: ShellAccess };

/** The administration area's own sidebar: back to the app, then its groups (ADR 0036, 0050). */
export function AdminNav({ access }: AdminNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const groups = visibleAdminGroups({ permissions: access.permissions });
  const hrefs = groups.flatMap((group) =>
    group.pages.flatMap((page) => page.tabs.map((tab) => tab.href)),
  );
  const current = activeHref({ pathname, hrefs });
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("backToApp")}>
                <Link href={ROUTES.home}>
                  <ArrowLeftIcon />
                  <span>{t("backToApp")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {groups.map((group) => (
        <SidebarGroup key={group.id}>
          <SidebarGroupLabel>{t(`adminGroups.${group.id}`)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.pages.map(({ key, icon: Icon, tabs }) => {
                const first = tabs[0]?.href ?? ROUTES.admin;
                const active = tabs.some((tab) => tab.href === current);
                return (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton asChild isActive={active} tooltip={t(key)}>
                      <Link href={first}>
                        <Icon />
                        <span>{t(key)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
