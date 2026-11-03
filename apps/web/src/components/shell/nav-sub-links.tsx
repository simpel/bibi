import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@bibi/ui";
import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import type { NavChild, NavItem } from "./nav-items";

export type NavSubLinksProps = {
  item: NavItem & { children: readonly NavChild[] };
  current: string | null;
};

/**
 * An entry with sub-pages (Work orders → Today, All): the entry opens its default page and,
 * while one of its pages is open, shows the sub-pages; the chevron expands it anywhere.
 */
export function NavSubLinks({ item, current }: NavSubLinksProps) {
  const t = useTranslations("nav");
  const { href, labelKey, icon: Icon, children } = item;
  const inside = children.some((child) => child.href === current) || href === current;
  return (
    <Collapsible asChild defaultOpen={inside} className="group/sub">
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={inside} tooltip={t(labelKey)}>
          <Link href={href}>
            <Icon />
            <span>{t(labelKey)}</span>
          </Link>
        </SidebarMenuButton>
        <CollapsibleTrigger asChild>
          <SidebarMenuAction aria-label={t(labelKey)} className="data-[state=open]:rotate-90">
            <ChevronRightIcon />
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton asChild isActive={child.href === current}>
                  <Link href={child.href}>
                    <span>{t(child.labelKey)}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
