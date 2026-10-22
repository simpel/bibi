"use client";

import { Link, usePathname } from "@okazi/i18n/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@okazi/ui";
import { BotIcon, ScrollTextIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/routes";

const ITEMS = [
  { href: ROUTES.mothershipLogs, labelKey: "logs", icon: ScrollTextIcon },
  { href: ROUTES.mothershipAiModels, labelKey: "aiModels", icon: BotIcon },
] as const;

/** Sections of the superadmin area. */
export function AdminNav() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {ITEMS.map(({ href, labelKey, icon: Icon }) => {
            const label = t(labelKey);
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(href)} tooltip={label}>
                  <Link href={href}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
