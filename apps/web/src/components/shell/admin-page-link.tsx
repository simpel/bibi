"use client";

import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import type { AdminPage } from "./admin-items";
import { adminSectionHref } from "./admin-search-index";
import { useRenderedAnchors } from "./use-rendered-anchors";

export type AdminPageLinkProps = { page: AdminPage; active: boolean };

/**
 * One page in the administration sidebar. While it is open and shows more than one section, those
 * sections are listed under it as links to their place on the page, exactly the ones on the page.
 */
export function AdminPageLink({ page, active }: AdminPageLinkProps) {
  const t = useTranslations("nav");
  const entries = useTranslations("adminArea.search.entries");
  const { key, icon: Icon, href } = page;
  const rendered = useRenderedAnchors({
    anchors: active ? page.sections.map((section) => section.anchor) : [],
  });
  const sections = page.sections.filter((section) => rendered.includes(section.anchor));
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={t(key)}>
        <Link href={href}>
          <Icon />
          <span>{t(key)}</span>
        </Link>
      </SidebarMenuButton>
      {active && sections.length > 1 ? (
        <SidebarMenuSub>
          {sections.map((section) => (
            <SidebarMenuSubItem key={section.id}>
              <SidebarMenuSubButton asChild>
                <Link href={adminSectionHref({ entry: { href, anchor: section.anchor } })}>
                  <span>{entries(`${section.id}.label`)}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
}
