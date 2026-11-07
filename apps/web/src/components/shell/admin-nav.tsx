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
import { useMemo, useState } from "react";
import { Link, usePathname } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { visibleAdminGroups } from "./admin-items";
import { AdminSearchField, AdminSearchResults, useAdminSearch } from "./admin-search";
import type { ShellAccess } from "./shell-types";
import { activeHref } from "./sidebar-link";

export type AdminNavProps = { access: ShellAccess };

/**
 * The administration area's own sidebar (ADR 0036, 0050): a search over every page and settings
 * block, back to the app, then its groups; while searching, the results take the groups' place.
 */
export function AdminNav({ access }: AdminNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const groups = visibleAdminGroups({ permissions: access.permissions });
  const hrefs = groups.flatMap((group) =>
    group.pages.flatMap((page) => page.tabs.map((tab) => tab.href)),
  );
  const current = activeHref({ pathname, hrefs });
  const [query, setQuery] = useState("");
  const hrefKey = hrefs.join(" ");
  const visibleHrefs = useMemo(() => new Set(hrefKey.split(" ")), [hrefKey]);
  const results = useAdminSearch({ query, visibleHrefs });
  return (
    <>
      <AdminSearchField query={query} onQueryChange={setQuery} first={results[0]} />
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
      {query.trim() ? <AdminSearchResults results={results} onPick={() => setQuery("")} /> : null}
      {query.trim()
        ? null
        : groups.map((group) => (
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
