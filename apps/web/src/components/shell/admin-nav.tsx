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
import { AdminPageLink } from "./admin-page-link";
import { AdminSearchField, AdminSearchResults, useAdminSearch } from "./admin-search";
import type { ShellAccess } from "./shell-types";
import { activeHref } from "./sidebar-link";

export type AdminNavProps = { access: ShellAccess };

/**
 * The administration area's own sidebar (ADR 0036, 0050): a search over every section, back to
 * the app, then its groups; the open page lists its sections as anchor links. While searching,
 * the results take the groups' place.
 */
export function AdminNav({ access }: AdminNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const groups = useMemo(
    () => visibleAdminGroups({ permissions: access.permissions }),
    [access.permissions],
  );
  const current = activeHref({
    pathname,
    hrefs: groups.flatMap((group) => group.pages.map((page) => page.href)),
  });
  const results = useAdminSearch({ query, groups });
  const searching = query.trim().length > 0;
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
      {searching ? <AdminSearchResults results={results} onPick={() => setQuery("")} /> : null}
      {searching
        ? null
        : groups.map((group) => (
            <SidebarGroup key={group.id}>
              <SidebarGroupLabel>{t(`adminGroups.${group.id}`)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.pages.map((page) => (
                    <AdminPageLink key={page.key} page={page} active={page.href === current} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
    </>
  );
}
