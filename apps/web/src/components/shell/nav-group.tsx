import { Link } from "@okazi/i18n/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@okazi/ui";
import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { NavItem } from "./nav-items";

export type NavGroupProps = {
  /** The group's label; without one the links stand on their own (no heading, not collapsible). */
  heading?: string;
  items: readonly NavItem[];
  current: string | null;
  defaultOpen?: boolean;
};

function NavLinks({ items, current }: Pick<NavGroupProps, "items" | "current">) {
  const t = useTranslations("nav");
  return (
    <SidebarMenu>
      {items.map(({ href, labelKey, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton asChild isActive={href === current} tooltip={t(labelKey)}>
            <Link href={href}>
              <Icon />
              <span>{t(labelKey)}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

/** One sidebar group (shadcn `SidebarGroup`); with a heading it expands and collapses. */
export function NavGroup({ heading, items, current, defaultOpen = true }: NavGroupProps) {
  const links = <NavLinks items={items} current={current} />;
  if (!heading) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>{links}</SidebarGroupContent>
      </SidebarGroup>
    );
  }
  const containsActive = items.some((item) => item.href === current);
  return (
    <Collapsible defaultOpen={defaultOpen || containsActive} className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger>
            {heading}
            <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>{links}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
