import {
  Building2Icon,
  CalendarIcon,
  KanbanIcon,
  LayoutDashboardIcon,
  PackageIcon,
  SparklesIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "../../components/sidebar/sidebar-group";
import { SidebarContent } from "../../components/sidebar/sidebar-layout";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
} from "../../components/sidebar/sidebar-menu";
import { SidebarMenuButton } from "../../components/sidebar/sidebar-menu-button";
import type { NavItemKey } from "./app-screen-shell";

export type AppSidebarNavProps = {
  activeNav: NavItemKey;
};

const ACTIVE_ASSISTANT_CLASS =
  "bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:text-primary-foreground";

function AssistantGroup({ activeNav }: AppSidebarNavProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Assistant</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeNav === "assistant"}
              tooltip="AI Assistant"
              className={activeNav === "assistant" ? ACTIVE_ASSISTANT_CLASS : ""}
            >
              <SparklesIcon className="size-4" />
              <span>AI Assistant</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

type NavItemProps = {
  active: boolean;
  tooltip: string;
  label: string;
  badge?: string;
  children: ReactNode;
};

function NavItem({ active, tooltip, label, badge, children }: NavItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={active} tooltip={tooltip}>
        {children}
        <span>{label}</span>
        {badge ? <SidebarMenuBadge>{badge}</SidebarMenuBadge> : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function WorkGroup({ activeNav }: AppSidebarNavProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Work</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <NavItem active={activeNav === "dashboard"} tooltip="Dashboard" label="Dashboard">
            <LayoutDashboardIcon className="size-4" />
          </NavItem>
          <NavItem active={activeNav === "pipeline"} tooltip="Pipeline" label="Pipeline" badge="12">
            <KanbanIcon className="size-4" />
          </NavItem>
          <NavItem active={activeNav === "tickets"} tooltip="Tickets" label="Tickets" badge="28">
            <TicketIcon className="size-4" />
          </NavItem>
          <NavItem active={activeNav === "customers"} tooltip="Customers" label="Customers">
            <UsersIcon className="size-4" />
          </NavItem>
          <NavItem active={activeNav === "calendar"} tooltip="Calendar" label="Calendar">
            <CalendarIcon className="size-4" />
          </NavItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function CatalogGroup({ activeNav }: AppSidebarNavProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Catalog</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={activeNav === "items"} tooltip="Items & Menus">
              <PackageIcon className="size-4" />
              <span>Items & Menus</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={activeNav === "venues"} tooltip="Venues & Rooms">
              <Building2Icon className="size-4" />
              <span>Venues & Spaces</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebarNav({ activeNav }: AppSidebarNavProps) {
  return (
    <SidebarContent>
      <AssistantGroup activeNav={activeNav} />
      <WorkGroup activeNav={activeNav} />
      <CatalogGroup activeNav={activeNav} />
    </SidebarContent>
  );
}
