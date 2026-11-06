"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@bibi/ui";
import { Link, usePathname } from "@/lib/navigation";

/** `external` links leave the locale-prefixed app routes (e.g. the API's own Scalar page). */
export type HelpNavLink = { href: string; label: string; external?: boolean };

export type HelpNavGroup = { label: string; links: HelpNavLink[] };

export type HelpNavProps = { groups: HelpNavGroup[] };

/** Sidebar groups of a help surface; labels arrive translated from the server layout. */
export function HelpNav({ groups }: HelpNavProps) {
  const pathname = usePathname();
  return groups.map((group) => (
    <SidebarGroup key={group.label}>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.links.map(({ href, label, external }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton asChild isActive={pathname === href}>
                {external ? <a href={href}>{label}</a> : <Link href={href}>{label}</Link>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}
